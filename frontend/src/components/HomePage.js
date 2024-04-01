import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './styles.css'; 

const HomePage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [posts, setPosts] = useState([]);
  const [showPostResult, setShowPostResult] = useState(false);
  const [showUserResult, setShowUserResult] = useState(false);
  const [searchTermPost, setSearchTermPost] = useState('');
  const [searchResultsPost, setSearchResultsPost] = useState([]);
  const [searchTermUser, setSearchTermUser] = useState('');
  const [searchResultsUser, setSearchResultsUser] = useState([]);
  const [postComments, setPostComments] = useState({});
  const [newComments, setNewComments] = useState({});

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userId = currentUser.user.id;

  const fetchAllPosts = async () => {
    try {
      const response = await fetch('https://tarea-1-mjadresic.onrender.com/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch All posts');
      }
      const postData = await response.json();
  
      // Obtener los nombres de usuario y avatares para cada ID de usuario en los posts
      const postsWithUserData = await Promise.all(postData.map(async (post) => {
        try {
          const userResponse = await fetch(`https://tarea-1-mjadresic.onrender.com/users/${post.userId}`);
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
          }
          const userData = await userResponse.json();
          return {
            ...post,
            username: userData.username,
            userAvatar: userData.avatar // Agregar el avatar del usuario al post
          };
        } catch (error) {
          console.error('Error fetching user data:', error);
          return post; 
        }
      }));
  
      // Ordenar las publicaciones de más reciente a más antiguo
      postsWithUserData.sort((a, b) => {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        return dateB - dateA;
      });
  
      // Obtener comentarios de cada publicación
      const comments = {};
      for (const post of postsWithUserData) {
        const commentsResponse = await fetch(`https://tarea-1-mjadresic.onrender.com/posts/${post.id}/comments`);
        if (!commentsResponse.ok) {
          throw new Error(`Failed to fetch comments for post ${post.id}`);
        }
        const postComments = await commentsResponse.json();
        
        // Obtener el nombre de usuario y avatar para cada comentario
        const commentsWithUserData = await Promise.all(postComments.map(async (comment) => {
          try {
            const userResponse = await fetch(`https://tarea-1-mjadresic.onrender.com/users/${comment.userId}`);
            if (!userResponse.ok) {
              throw new Error('Failed to fetch user data');
            }
            const userData = await userResponse.json();
            return {
              ...comment,
              username: userData.username,
              userAvatar: userData.avatar // Agregar el avatar del usuario al comentario
            };
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Si hay un error al obtener los datos del usuario, devolver el comentario sin nombre de usuario ni avatar
            return comment;
          }
        }));
  
        comments[post.id] = commentsWithUserData;
      }
  
      setPosts(postsWithUserData);
      setPostComments(comments); // Actualizar el estado con los comentarios que incluyen nombres de usuario y avatares
    } catch (error) {
      console.error('Error fetching All posts:', error);
    }
  };

  const leaveComment = async (postId) => {
    try {
      
      // Crear el objeto de comentario
      const commentData = {
        content: newComments[postId],
        userId: userId,
        postId: postId, // Añadir el postId al objeto de comentario
      };
  
      console.log('Request body:', commentData); // Imprimir el cuerpo de la solicitud en la consola
      
      const response = await fetch(`https://tarea-1-mjadresic.onrender.com/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData), // Convertir el objeto en formato JSON y enviarlo en el cuerpo de la solicitud
      });
      
      if (!response.ok) {
        throw new Error('Failed to leave a comment');
      }
      
      // Extraer el comentario creado del cuerpo de la respuesta
      const createdComment = await response.json();
  
      // Actualizar el estado de los comentarios de la publicación con el nombre de usuario
      const userResponse = await fetch(`https://tarea-1-mjadresic.onrender.com/users/${userId}`);
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await userResponse.json();
      const commentWithUserData = {
        ...createdComment,
        username: userData.username,
        userAvatar: userData.avatar // Agregar el avatar del usuario al comentario
      };
  
      // Actualizar el estado de los comentarios de la publicación
      setPostComments(prevComments => ({
        ...prevComments,
        [postId]: [...(prevComments[postId] || []), commentWithUserData],
      }));
      
      // Limpiar el campo de comentario asociado a la publicación
      setNewComments({
        ...newComments,
        [postId]: '',
      });
    } catch (error) {
      console.error('Error leaving a comment:', error);
    }
  };
  
  

  // Función para manejar la creación de un nuevo post
  const createNewPost = async () => {
    try {
      const postData = {
        title: image.trim() !== '' ? title : title + ' (No title provided)',
        content,
        userId,
        image: image.trim() !== '' ? image : '(No image provided)' 
      };
  
      const response = await fetch('https://tarea-1-mjadresic.onrender.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      });
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      // Recargar los posts después de crear uno nuevo
      fetchAllPosts();
      // Limpiar los campos del formulario después de crear el post
      setTitle('');
      setContent('');
      setImage('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };
  
  

  // Función para manejar cambios en el campo de comentario
  const handleCommentChange = (postId, comment) => {
    setNewComments({
      ...newComments,
      [postId]: comment,
    });
  };

  useEffect(() => {
    const updateCommentsWithUserData = async () => {
      const updatedComments = {};
      for (const postId in postComments) {
        const commentsWithUserData = await Promise.all(postComments[postId].map(async (comment) => {
          try {
            const userResponse = await fetch(`https://tarea-1-mjadresic.onrender.com/users/${comment.userId}`);
            if (!userResponse.ok) {
              throw new Error('Failed to fetch user data');
            }
            const userData = await userResponse.json();
            return {
              ...comment,
              username: userData.username,
              userAvatar: userData.avatar // Agregar el avatar del usuario al comentario
            };
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Si hay un error al obtener los datos del usuario, devolver el comentario sin nombre de usuario ni avatar
            return comment;
          }
        }));
        updatedComments[postId] = commentsWithUserData;
      }
      // Actualizar el estado solo si el valor ha cambiado
      if (JSON.stringify(updatedComments) !== JSON.stringify(postComments)) {
        setPostComments(updatedComments);
      }
    };
  
    fetchAllPosts();
    updateCommentsWithUserData();
  }, []);



  return (
    <div className="container">
      <div className="image-container">
        <img src="integram.png" alt="Profile" className="profile-image" />
      </div>

      <div>
        <h1>Boton para ver mi perfil:</h1>
      <Link to={`/users/${currentUser.user.id}`}>
        <button className="btn">Ver mi perfil</button>
      </Link>
      </div>

      <div>
        <Link to="/">
          <button className="btn">Volver a LandingPage</button>
        </Link>
      </div>


      <h1 className="title">Crear una nueva publicación</h1>

      <div className="create-post">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input"
        />
        <input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="input"
        />
        <button onClick={createNewPost} className="btn">Create Post</button>
      </div>

      <h1 className="title">Publicaciones</h1>
      <div className="posts-section" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {posts.map((post) => (
          <div key={post.id} className="post-container">
            <div className="posts-container">
              <div className="content">
                <h3>Título: {post.title}</h3>
                <p>Descripción: {post.content}</p>
                <p>Autor: <Link to={`/users/${post.userId}`}>{post.username}</Link></p>
                <p>
                  Avatar: 
                  <Link to={`/users/${post.userId}`}>
                    <img src={post.userAvatar} alt="Avatar" style={{ maxWidth: '50px', maxHeight: '50px' }} />
                  </Link>
                </p>
                {post.image && <img src={post.image} alt="Post" className="image" style={{ maxWidth: '100%', maxHeight: '200px' }} />}
                <p>Fecha de creación: {post.created}</p>
              </div>
            </div>
            <div className="comments-container">
            <p>Comentarios:</p>
            <div className="comments-list">
                {postComments[post.id] && postComments[post.id].map((comment) => (
                  <div key={comment.id}>
                    <p>
                      <strong>
                        <Link to={`/users/${comment.userId}`}>
                          <img src={comment.userAvatar} alt="Avatar" style={{ maxWidth: '30px', maxHeight: '30px', marginRight: '5px' }} />
                          {comment.username || 'Loading...'}
                        </Link>
                      </strong>: {comment.content}
                    </p>
                    <p>Fecha de creación: {comment.created}</p>
                  </div>
                ))}
              </div>
              <div className="comment-input">
                <input
                  type="text"
                  placeholder="Deja un comentario..."
                  value={newComments[post.id] || ''}
                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  className="input"
                />
                <button onClick={() => leaveComment(post.id)} className="btn">Comentar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;