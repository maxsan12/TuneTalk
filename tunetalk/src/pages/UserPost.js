import React, { useEffect, useState } from "react";
import axios from 'axios';
import "../css/App.css"; // NOTE: put 2 . ("..") since this file is in it's own folder too. 
import "../css/Post.css";
import StarRating from "./StarRating";
import { useUser } from "../authentication/UserState";

function UserPost() {

    const [recentTrack, setRecentTrack] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [postusername, setPostUsername] = useState('')
    const [email, setEmail] = useState('')
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [rating, setRating] = useState('')
    const [spotifyURL, setSpotifyURL] = useState('');
    const [caption, setCaption] = useState('')
    const [error, setError] = useState(null)
    const [imageData, setImageData] = useState('');
    const [user] = useUser();
    const[ previewURL, setPreviewURL] = useState('');
    const [username] = user.username;

    const [selectedRating, setSelectedRating] = useState(0); // State variable to store the selected rating

    // Callback function to handle the rating change
    const handleRatingChange = (rate) => {
        setSelectedRating(rate);
    };

    const token = localStorage.getItem("access_token");

    const getRecentTrack = () => {


        if (!token) {
            console.log('No token available'); //log an error if no token is available
            return;
        }

        //make a get request to the spotify api
        axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
            headers: {
                'Authorization': `Bearer ${token}` // set the autherization header with the token
            }
        }).then(response => {
                const track = response.data.items[0].track; //extract track info from the response
    
                //update the recentTrack state with the track details
                setRecentTrack({
                    artist: track.artists.map(artist => artist.name).join(', '), //join multiple artists the a comma
                    title: track.name, //title 
                    albumCover: track.album.images[0].url, // URL of album image
                    spotifyURL: track.external_urls.spotify, // URL of the spotify song
                    previewURL: track.preview_url // URL of 30s song preview
                });
                
                setSpotifyURL(track.external_urls.spotify);
                setPreviewURL(track.preview_url);

                //prepare song to be saved
                const songData = {
                    title: track.name,
                    artist: track.artists.map(artist => artist.name).join(', '),
                    albumCover: track.album.images[0].url,      
                    spotifyURL: track.external_urls.spotify,         
                    previewURL: track.preview_url,   
                    comments: [],
                    rating: StarRating,
                }

            }).catch(error => {
                console.log('Error fetching recent track:', error); //log any errors during the call
            });
    };

    const handleSubmission = async (e) => {

        e.preventDefault();
        
        // Validation check to ensure post isn't made if the user does not input a caption and rating
        if (selectedRating <= 0 || !caption.trim()) {
            alert("Please provide a valid rating and a caption.");
            return;
        }
        
        const confirmation = window.confirm("Are you sure you want to post this song? (All your friends will see)");
        if (!confirmation) {
            return; // If they don't confirm, do nothing further
        }
        
        const post = { postusername, imageData, email, title, artist, rating: selectedRating, caption, spotifyURL, previewURL};
        console.log(post);
        
        console.log("Preview URL: ", previewURL);
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                body: JSON.stringify(post),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const json = await response.json();
                
            if (!response.ok) {
                setError(json.error);
                
            } else {
                setError(null);
                console.log('Post added');
                setCaption(''); // Reset caption after posting
                setSelectedRating(0); // Optionally reset the rating as well
                window.location.reload();  // This will reload the current page
            }
        } catch (error) {
            console.error('Error posting:', error);
            alert("An error occurred while posting. Please try again."); // if theres any error with posting 
        }
    };

    return (
        <div className="poster-container">
            
            <div className="button-container">
                <div className="button-box">
                    <button onClick={getRecentTrack}>POST NOW!</button>
                </div>
            </div>

            {/* Display the recent track information */}
            {recentTrack && (
                <div className="post-card">
                    <div className="post-card-content">
                        <h2 className="song-title">{recentTrack.title}</h2>
                        <h3 className="artist-name">{recentTrack.artist}</h3>
                    </div>
                    <div className="post-card-image-container">
                        <img src={recentTrack.albumCover} alt={`${recentTrack.title} Album Cover`} className="post-card-image" />
                        <StarRating onRating={(rate) => {console.log(rate); setSelectedRating(rate)}} />
                    </div>
                    <div className="post-card-content">
                        {/* Render existing comments */}
                        <div className="comments-container">
                        {comments.map((c) => (
                            <div key={c.id} className="comment">
                                <p>{c.body}</p>
                                <small>{new Date(c.date).toLocaleString()}</small>
                            </div>
                        ))}
                        </div>
                        {/* Comment form */}
                        <form onSubmit={handleSubmission}>
                            <input
                                type="text"
                                className="comment-input"
                                placeholder="Add a caption..."
                                value={caption}
                                onChange={(e) => {
                                    console.log(user.email);
                                    console.log(user.username);
                                    setCaption(e.target.value);
                                    setPostUsername(user.username);
                                    setEmail(user.email);
                                    setTitle(recentTrack.title);
                                    setArtist(recentTrack.artist);
                                    setImageData()
                                    setRating(selectedRating);
                                    console.log(setPostUsername);
                                    console.log(setEmail);
                                    fetch(recentTrack.albumCover).then(response => response.blob()).then(blob => 
                                    {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const base64Data = reader.result; // Base64 string of the image
                                            // Store the base64 string in state
                                            setImageData(base64Data);
                                            console.log(base64Data)
                                        };
                                        reader.readAsDataURL(blob);
                                    })
                                    .catch(error => {
                                        console.log('Error fetching image:', error);
                                    })
                                }}
                            />
                            <button type="submit" className="submit-comment" onMouseDown={(e) => {
                                    
                                    setPostUsername(user.username);
                                    setEmail(user.email);
                                    setTitle(recentTrack.title);
                                    setArtist(recentTrack.artist);
                                    // setSpotifyURL(recentTrack.external_urls.spotify)
                                    setRating(selectedRating);
                                    fetch(recentTrack.albumCover).then(response => response.blob()).then(blob => 
                                        {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64Data = reader.result; // Base64 string of the image
                                                // Store the base64 string in state
                                                setImageData(base64Data);
                                                console.log(base64Data)
                                            };
                                            reader.readAsDataURL(blob);
                                        })
                                        .catch(error => {
                                            console.log('Error fetching image:', error);
                                        })
                                
                                
                                }}>Post</button>
                        </form>
                    </div>
                </div>
            )}
        </div> 
    );
}

export default UserPost;