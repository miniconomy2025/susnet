import React, { useState } from 'react'
import CreatePostModal from '../components/CreatePost/CreatePostModal'

function Explore() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostSubmit = (data) => {
    console.log("New post:", data);
    // Send to backend or update feed
  };

  return (
    <CreatePostModal onSubmit={handlePostSubmit} />
  );
}

export default Explore