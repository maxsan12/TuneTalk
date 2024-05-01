import React, { useState } from "react";
import axios from 'axios';
import "../css/App.css"; // NOTE: put 2 . ("..") since this file is in it's own folder too. 
import "../css/Post.css";
import StarRating from "./StarRating";

function Post() {

    //variables and hooks
    const [recentTrack, setRecentTrack] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const token = localStorage.getItem("access_token");
    const username = localStorage.getItem("userlogin");
    const [posted, setPosted] = useState(false);


    const postId = localStorage.getItem("postId");
    //function to retrieve users recerntly played song 
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
                albumCover: track.album.images[0].url // URL of album image
            });

            //prepare song to be saved
            const songData = {
                title: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                albumCover: track.album.images[0].url,
                comments: [],
                rating: 0,
            }

            saveTrackToDatabase(username, songData);
            setPosted(true);

        }).catch(error => {
            console.log('Error fetching recent track:', error); //log any errors during the call
        });
    };

    //api that saves the song information in the db
    const saveTrackToDatabase = (username, songData) => {
        console.log(songData);
        axios.post(`http://localhost:8082/api/user/${username}/addPost`, songData)
            .then(response => {
                console.log('Song post saved:', response.data);
                localStorage.setItem("postId", response.data._id);
            })
            .catch(error => {
                console.error('Error saving the song post:', error.response.data);
            });
    };

    //sets the new comments
    const handleCommentSubmit = (e) => {
        e.preventDefault();

        const newCommentToAdd = {
            id: comments.length + 1,
            username: username,
            body: newComment,
            date: new Date(),
            replies: []
        };

        setComments([...comments, newCommentToAdd]);
        setNewComment('');
    };

    //sets the new replies
    const handleReplySubmit = async (commentId, e) => {
        e.preventDefault();
        addReplyToComment(commentId, replyTexts[commentId]);
        setReplyTexts({ ...replyTexts, [commentId]: '' });
    };

    //adds the reply to the parent comment
    const addReplyToComment = (commentId, replyText) => {
        const updatedComments = comments.map(comment => {
            if (comment.id === commentId) {
                const newReply = {
                    id: comment.replies.length + 1,
                    username: username,
                    body: replyText,
                    date: new Date()
                };
                return { ...comment, replies: [...comment.replies, newReply] };
            }
            return comment;
        });
        setComments(updatedComments);
    };


    const handleRatingSubmit = async (rate, postId) => {
        axios.post(`http://localhost:8082/api/posts/${postId}/rate`, { rating: rate })
            .then(response => {
                console.log('Rating submitted:', response.data);
            })
            .catch(error => {
                console.error('Error submitting rating:', error);
            });
    };

    return (
        <div className="home-page">
            <div className="button-container">
                {!posted && <button onClick={getRecentTrack}>Show Last Played Song</button>}
            </div>

            {recentTrack && (
                <div className="post-card">
                    <div className="post-card-content">
                        <h2 className="song-title">{recentTrack.title}</h2>
                        <h3 className="artist-name">{recentTrack.artist}</h3>
                    </div>
                    <div className="post-card-image-container">
                        <img src={recentTrack.albumCover} alt={`${recentTrack.title} Album Cover`} className="post-card-image" />
                        <StarRating onRating={(rate) => {console.log(rate); // Call the increment function
                        }} />
                    </div>
                    <div className="post-card-content">
                        {comments.map(comment => (
                            <div key={comment.id} className="comment-box">
                                <div className="comment-header">
                                    <strong>{comment.username}</strong>
                                    <p>{comment.body}<br></br></p>
                                    <small>{new Date(comment.date).toLocaleString()}</small>
                                </div>
                                <div className="replies-container">
                                    {comment.replies && comment.replies.map(reply => (
                                        <div key={reply.id} className="reply-box">
                                            <div className="reply-content">
                                                <strong>{reply.username}</strong>
                                                <p>{reply.body}</p>
                                                <small>{new Date(reply.date).toLocaleString()}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={(e) => handleReplySubmit(comment.id, e)}>
                                    <input
                                        type="text"
                                        placeholder="Reply..."
                                        value={replyTexts[comment.id] || ''}
                                        onChange={(e) => setReplyTexts({ ...replyTexts, [comment.id]: e.target.value })}
                                    />
                                    <button type="submit">Reply</button>
                                </form>
                            </div>
                        ))}
                        <form onSubmit={handleCommentSubmit}>
                            <input
                                type="text"
                                className="comment-input"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="submit" className="submit-comment">Post</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Post;