import React, { useState, useEffect } from "react";
import { FaCheck, FaPlus } from "react-icons/fa";
import "../../css/Community.css";
import { useUser } from "../../authentication/UserState";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronCircleDown } from "@fortawesome/free-solid-svg-icons";

/**
 * Spotify endpoints
 */
const SPOTIFY_API = "https://api.spotify.com/v1";

/**
 * Reuse the USER access token from your SpotifyLogin page.
 * (Do NOT use client_secret in frontend.)
 */
const getSpotifyToken = () => {
  // your newer SpotifyLogin stores this key
  const t1 = localStorage.getItem("spotify_access_token");
  // your older code used this key
  const t2 = localStorage.getItem("access_token");
  return t1 || t2 || null;
};

function Pop() {
  const [isFollowing, setIsFollowing] = useState(false);

  // Spotify
  const [popPlaylists, setPopPlaylists] = useState([]);
  const [featuredTrack, setFeaturedTrack] = useState(null);
  const [previewURL, setPreviewURL] = useState("");

  // App state
  const [user] = useUser();
  const [followerCount, setFollowerCount] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);

  // Comments/ratings
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  // Collapse comment box
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  /* ---------------- FOLLOW / UNFOLLOW (unchanged) ---------------- */

  const handleFollowClick = async () => {
    if (!isFollowing) {
      try {
        await axios.post(
          `http://localhost:8082/api/community/follow/${encodeURIComponent(
            user.username
          )}`,
          { community: "pop", followStatus: true }
        );
        setIsFollowing(true);
      } catch (err) {
        console.error("Error updating follow status:", err);
      }
    } else {
      try {
        await axios.post(
          `http://localhost:8082/api/community/un-follow/${encodeURIComponent(
            user.username
          )}`,
          { community: "pop", followStatus: false }
        );
        setIsFollowing(false);
      } catch (err) {
        console.error("Error updating un-follow status:", err);
      }
    }
  };

  const fetchFollowStatus = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8082/api/community/status/${encodeURIComponent(
          user.username
        )}`
      );
      setIsFollowing(response.data.pop);
    } catch (err) {
      console.error("Error fetching follow status:", err);
    }
  };

  const fetchInitialFollow = async () => {
    try {
      await axios.post(
        `http://localhost:8082/api/community/initiate-follows/${encodeURIComponent(
          user.username
        )}`
      );
    } catch (err) {
      console.error("Error initializing follow record:", err);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchInitialFollow();
      fetchFollowStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username]);

  /* ---------------- SPOTIFY: FETCH PLAYLISTS (FIXED) ---------------- */

  useEffect(() => {
    const token = getSpotifyToken();
    if (!token) {
      // Not logged into Spotify yet -> just don’t fetch
      return;
    }

    const controller = new AbortController();

    const fetchPopPlaylists = async () => {
      try {
        // 1) try the old direct category id (may 404 depending on locale/market)
        const tryUrl = `${SPOTIFY_API}/browse/categories/pop/playlists?market=US&limit=12`;
        let res = await fetch(tryUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        // 2) if 404, fetch categories and find Pop dynamically
        if (res.status === 404) {
          const catsUrl = `${SPOTIFY_API}/browse/categories?locale=en_US&limit=50&country=US`;
          const catsRes = await fetch(catsUrl, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });

          if (!catsRes.ok) {
            throw new Error(
              `Failed to fetch categories: ${catsRes.status} ${catsRes.statusText}`
            );
          }

          const catsData = await catsRes.json();
          const items = catsData?.categories?.items || [];
          const popCategory =
            items.find((c) => (c?.id || "").toLowerCase() === "pop") ||
            items.find((c) =>
              (c?.name || "").toLowerCase().includes("pop")
            );

          if (!popCategory?.id) {
            throw new Error("Could not find a Pop category from Spotify.");
          }

          const fixedUrl = `${SPOTIFY_API}/browse/categories/${encodeURIComponent(
            popCategory.id
          )}/playlists?market=US&limit=12`;

          res = await fetch(fixedUrl, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
        }

        if (!res.ok) {
          throw new Error(`Spotify playlists failed: ${res.status}`);
        }

        const data = await res.json();
        setPopPlaylists(data?.playlists?.items || []);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Fetching pop playlists failed:", error);
        setPopPlaylists([]);
      }
    };

    fetchPopPlaylists();

    return () => controller.abort();
  }, []);

  /* ---------------- SPOTIFY: FEATURED TRACK (FIXED TOKEN) ---------------- */

  useEffect(() => {
    const token = getSpotifyToken();
    if (!token) return;
    if (!popPlaylists || popPlaylists.length === 0) return;

    const controller = new AbortController();

    const fetchFeaturedTrack = async () => {
      try {
        const chosenPlaylist = popPlaylists[0];

        const tracksUrl = `${SPOTIFY_API}/playlists/${chosenPlaylist.id}/tracks?limit=1`;
        const tracksResponse = await fetch(tracksUrl, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!tracksResponse.ok) {
          throw new Error(`Tracks fetch failed: ${tracksResponse.status}`);
        }

        const tracksData = await tracksResponse.json();
        const first = tracksData?.items?.[0]?.track;

        if (first) {
          setFeaturedTrack(first);
          setPreviewURL(first.preview_url || "");
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Fetching featured track failed:", error);
      }
    };

    fetchFeaturedTrack();
    return () => controller.abort();
  }, [popPlaylists]);

  /* ---------------- BACKEND SONG POST (unchanged) ---------------- */

  useEffect(() => {
    const postFeaturedTrack = async () => {
      if (!featuredTrack) return;

      await axios
        .post("http://localhost:8082/api/songs", {
          spotifyUrl: featuredTrack.external_urls.spotify,
          previewURL: previewURL,
        })
        .then((response) => {
          console.log("Song added:", response.data);
        })
        .catch((error) => {
          if (error.response && error.response.status === 409) {
            console.log("Song already exists.");
          } else {
            console.error("Error posting featured track:", error);
          }
        });
    };

    postFeaturedTrack();
  }, [featuredTrack, previewURL]);

  /* ---------------- FOLLOWERS (unchanged) ---------------- */

  function FollowerListModal({ followers, onClose }) {
    return (
      <div className="follower-modal">
        <h2>Followers</h2>
        <ul>
          {followers.map((follower, index) => (
            <li key={index}>{follower.username}</li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  useEffect(() => {
    const communityName = "pop";

    const fetchFollowerCount = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8082/api/community/${communityName}/followers/count`
        );
        setFollowerCount(response.data.count);
      } catch (error) {
        console.error("Error fetching follower count:", error);
      }
    };

    const fetchFollowers = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8082/api/community/${communityName}/followers`
        );
        setFollowers(response.data);
      } catch (error) {
        console.error("Error fetching followers:", error);
      }
    };

    fetchFollowerCount();
    fetchFollowers();
  }, []);

  /* ---------------- COMMENTS (unchanged) ---------------- */

  const fetchComments = async (spotifyUrl) => {
    try {
      const response = await axios.get(
        `http://localhost:8082/api/songs/comments/${encodeURIComponent(
          spotifyUrl
        )}`
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (featuredTrack) {
      fetchComments(featuredTrack.external_urls.spotify);
    }
  }, [featuredTrack]);

  useEffect(() => {
    if (comments.length > 0) {
      const totalRating = comments.reduce((acc, c) => acc + c.rating, 0);
      const avg = totalRating / comments.length;
      setAverageRating(Math.round(avg * 2) / 2);
    } else {
      setAverageRating(0);
    }
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to post comments.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8082/api/songs/comment", {
        spotifyUrl: featuredTrack.external_urls.spotify,
        username: user.username,
        comment,
        rating,
      });
      console.log("Comment added:", response.data);
      setComment("");
      setRating(1);
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleRating = (rate) => {
    setRating(rate);
    const stars = document.querySelectorAll(".rating i");
    stars.forEach((star, idx) => {
      if (idx < rate) {
        star.classList.remove("far");
        star.classList.add("fas");
      } else {
        star.classList.remove("fas");
        star.classList.add("far");
      }
    });
  };

  function StarRating({ rating }) {
    const totalStars = 5;
    let stars = [];
    for (let i = 1; i <= totalStars; i++) {
      if (i <= rating) {
        stars.push(<i key={i} className="fas fa-star" style={{ color: "#ffc107" }} />);
      } else if (i > rating && i - 1 < rating) {
        stars.push(
          <i key={i} className="fas fa-star-half-alt" style={{ color: "#ffc107" }} />
        );
      } else {
        stars.push(<i key={i} className="far fa-star" style={{ color: "#ffc107" }} />);
      }
    }
    return <div>{stars}</div>;
  }

  return (
    <div className="container-page">
      <div className="follow-container">
        <h1>Pop Music</h1>
        <button onClick={handleFollowClick} className="follow-button">
          {isFollowing ? (
            <>
              <FaCheck /> Following
            </>
          ) : (
            <>
              <FaPlus /> Follow
            </>
          )}
        </button>
        <div className="follower-info">
          <span className="follower-count" onClick={() => setShowFollowers(true)}>
            {followerCount} followers
          </span>
        </div>
      </div>

      {showFollowers && (
        <FollowerListModal followers={followers} onClose={() => setShowFollowers(false)} />
      )}

      <div className="featured-track-container">
        <h2>Todays Featured Track</h2>

        {featuredTrack && (
          <div className="track-card">
            <img
              src={featuredTrack.album.images[0].url}
              alt={featuredTrack.name}
              className="track-image"
            />
            <div className="track-info">
              <div className="track-title">{featuredTrack.name}</div>
              <div className="track-artist">
                {featuredTrack.artists.map((artist) => artist.name).join(", ")}
              </div>

              <div>
                <br />
                {previewURL && (
                  <audio controls src={previewURL}>
                    Your browser does not support the audio element.
                  </audio>
                )}
                <br />
                <br />
                <a
                  href={featuredTrack.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-play-button"
                >
                  Listen on Spotify
                </a>
              </div>
            </div>
          </div>
        )}

        <h4 className="community-h4">Comment and rate the song</h4>
        <form onSubmit={handleSubmit}>
          <input
            className="community-input"
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            required
          />
          <div className="rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <label key={star}>
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  onClick={() => handleRating(star)}
                />
                <i className={star <= rating ? "fas fa-star" : "far fa-star"}></i>
              </label>
            ))}
          </div>
          <button className="community-btn" type="submit">
            Post Comment and Rating
          </button>
        </form>
      </div>

      <div className="community-comments-container">
        <div className="toggleText" onClick={toggleVisibility} style={{ cursor: "pointer" }}>
          <h5>
            Tap to {isVisible ? "hide" : "view"} comment{" "}
            <FontAwesomeIcon
              icon={faChevronCircleDown}
              className={`icon ${isVisible ? "up" : "down"}`}
            />
          </h5>
        </div>

        <div className={`collapsible-content ${isVisible ? "open" : ""}`}>
          {isVisible && (
            <div>
              <h4 className="community-h4">
                Average Rating: <StarRating rating={averageRating} />
              </h4>
              {comments.map((c, index) => (
                <div key={index} className="comment">
                  <p>
                    <strong>{c.username}</strong>
                  </p>
                  <StarRating rating={c.rating} /> : <span>{c.body}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="playlists-container">
        {popPlaylists.map((playlist) => (
          <div key={playlist.id} className="playlist-card">
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="playlist-image"
            />
            <div className="playlist-info">
              <h3>{playlist.name}</h3>
              <a
                href={playlist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="playlist-link"
              >
                Listen on Spotify
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pop;
