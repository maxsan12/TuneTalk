import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../authentication/UserState";
import "../../css/App.css";

const SPOTIFY_AUTH = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN = "https://accounts.spotify.com/api/token";

const REDIRECT_URI = "http://127.0.0.1:3000/account/spotify";
const CLIENT_ID = "a8c9857ace8449f290ed14c54c878e1f";

const spotifyScopes = [
  "user-read-recently-played",
  "user-read-email",
  "user-read-private",
];

const ACCESS_TOKEN_KEY = "spotify_access_token";
const ACCESS_TOKEN_EXPIRES_AT_KEY = "spotify_access_token_expires_at";
const CODE_VERIFIER_KEY = "spotify_pkce_code_verifier";

/* -------------------- PKCE helpers -------------------- */
const randomString = (length = 64) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let text = "";
  const values = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) text += possible[values[i] % possible.length];
  return text;
};

const base64UrlEncode = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
};

const storeToken = (token, expiresInSeconds) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  if (typeof expiresInSeconds === "number" && expiresInSeconds > 0) {
    localStorage.setItem(
      ACCESS_TOKEN_EXPIRES_AT_KEY,
      String(Date.now() + expiresInSeconds * 1000)
    );
  } else {
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  }
};

const getStoredToken = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY));
  if (!token) return null;
  if (!expiresAt) return token; // fallback
  if (Number.isNaN(expiresAt)) return token;
  return Date.now() >= expiresAt ? null : token;
};

const clearStoredToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
};

/* -------------------- Login redirect (PKCE) -------------------- */
export const handleLogin = async (e) => {
  if (e?.preventDefault) e.preventDefault();

  const codeVerifier = randomString(96);
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: spotifyScopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    show_dialog: "true",
  });

  window.location.assign(`${SPOTIFY_AUTH}?${params.toString()}`);
};

export const SpotifyLogin = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [user, setUser] = useUser();
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code");

        // If Spotify sent an error back
        if (error) {
          setAlertMessage(`Spotify login error: ${error}`);
          return;
        }

        // 1) If redirected back with ?code=..., exchange it for access_token
        if (code) {
          const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
          if (!codeVerifier) {
            setAlertMessage("Missing PKCE code_verifier. Please try logging in again.");
            return;
          }

          const body = new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          });

          const tokenRes = await fetch(SPOTIFY_TOKEN, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          });

          if (!tokenRes.ok) {
            const text = await tokenRes.text();
            throw new Error(`Token exchange failed (${tokenRes.status}): ${text}`);
          }

          const tokenJson = await tokenRes.json();
          if (!tokenJson?.access_token) throw new Error("No access_token returned.");

          storeToken(tokenJson.access_token, tokenJson.expires_in);

          // clean URL: remove ?code=... (no reload)
          window.history.replaceState(null, document.title, url.pathname);
        }

        // 2) Use stored token (works on refresh)
        const token = getStoredToken();
        if (!token) return;

        // 3) Fetch Spotify profile
        const userInfoResponse = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const spotifyProfile = userInfoResponse.data;
        if (!spotifyProfile) throw new Error("User information is not available.");

        const spotifyUserInfo = {
          userId: spotifyProfile.id,
          userUrl: spotifyProfile.external_urls?.spotify,
          username: spotifyProfile.display_name,
          email: spotifyProfile.email,
        };

        setUserInfo(spotifyUserInfo);
        setAlertMessage("Spotify account connected!");

        localStorage.setItem("username", spotifyUserInfo.username || "");
        localStorage.setItem("userSpotifyInfo", JSON.stringify(spotifyUserInfo));

        // 4) Store in your MongoDB via backend
        const res = await axios.post("http://localhost:8082/api/spotifylogin", {
          spotifyID: spotifyProfile.id,
          spotifyURL: spotifyProfile.external_urls?.spotify,
          displayName: spotifyProfile.display_name,
          spotifyEmail: spotifyProfile.email,
        });

        if (res.data?.status === "ok") {
          setUser((prev) => ({
            ...prev,
            isAuthenticated: true,
            spotifyAccount: spotifyUserInfo.username,
          }));
          navigate("/account/spotify");
        } else {
          throw new Error("Unable to store spotify account into TuneTalk's database.");
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) clearStoredToken();
        console.error("Error connecting to Spotify:", err);
        setAlertMessage("Failed to connect to Spotify");
      }
    };

    run();
  }, [navigate, setUser]);

  useEffect(() => {
    if (user?.isAuthenticated) navigate("/account/spotify");
  }, [navigate, user?.isAuthenticated]);

  return (
    <div className="spotify-login-container">
      {user?.isAuthenticated && userInfo ? (
        <div>
          <h3>{alertMessage}</h3>
          <div>
            <br /><br />
            <h4>Spotify Details:</h4>
            <p><b>User ID:</b> {userInfo.userId}</p>
            <p><b>Username:</b> {userInfo.username}</p>
            <p><b>Email:</b> {userInfo.email}</p>
            <br /><br /><br />
            <button type="button" onClick={() => navigate("/feed")}>
              View your feed!
            </button>
          </div>
        </div>
      ) : (
        <div className="spotify-login-container">
          <h3>
            Nearly there! <br /> You need to connect your Spotify Account with TuneTalk
          </h3>
          <br />
          <button
            type="button"
            className="spotify-button"
            onClick={handleLogin}
          >
            Login to your Spotify Account
          </button>
          <br /><br />
          {alertMessage ? <p>{alertMessage}</p> : null}
        </div>
      )}
    </div>
  );
};
