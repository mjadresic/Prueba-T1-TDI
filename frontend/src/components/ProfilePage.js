import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './styles.css';

const ProfilePage = () => {
  const { userId } = useParams(); 
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postComments, setPostComments] = useState({});
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener datos del usuario
        const userResponse = await fetch(`https://prueba-t1-tdi.onrender.com/users/${userId}`);
        if (!userResponse.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await userResponse.json();
        setUser(userData);
  
        // Obtener publicaciones del usuario
        const postsResponse = await fetch(`https://prueba-t1-tdi.onrender.com/posts`);
        if (!postsResponse.ok) {
          throw new Error('Failed to fetch user posts');
        }

        const allPosts = await postsResponse.json();
        const userPosts = allPosts.filter(post => post.userId === parseInt(userId));
        
        // Obtener el nombre de usuario para cada publicación
        for (const post of userPosts) {
          const userPostResponse = await fetch(`https://prueba-t1-tdi.onrender.com/users/${post.userId}`);
          if (!userPostResponse.ok) {
            throw new Error(`Failed to fetch user data for post ${post.id}`);
          }
          const postUserData = await userPostResponse.json();
          post.username = postUserData.username; // Asignar el nombre de usuario a la publicación
        }
        
        // Ordenar las publicaciones de más nuevas a más viejas
        userPosts.sort((a, b) => new Date(b.created) - new Date(a.created));
        setPosts(userPosts);
        
        // Obtener comentarios de las publicaciones
        const comments = {};
        for (const post of userPosts) {
          console.log(`Fetching comments for post ${post.id}`);
          const commentsResponse = await fetch(`https://prueba-t1-tdi.onrender.com/posts/${post.id}/comments`);
          console.log(commentsResponse);
          if (!commentsResponse.ok) {
            throw new Error(`Failed to fetch comments for post ${post.id}`);
          }
          const postComments = await commentsResponse.json();
          
          // Obtener el nombre de usuario para cada comentario
          for (const comment of postComments) {
            const commentUserResponse = await fetch(`https://prueba-t1-tdi.onrender.com/users/${comment.userId}`);
            if (!commentUserResponse.ok) {
              throw new Error(`Failed to fetch user data for comment ${comment.id}`);
            }
            const commentUserData = await commentUserResponse.json();
            comment.username = commentUserData.username; // Asignar el nombre de usuario al comentario
          }

          comments[post.id] = postComments;
        }
        setPostComments(comments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, [userId]);
  

  // Función para manejar la creación de un nuevo comentario
  const leaveComment = async (postId) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const userId = currentUser.user.id;
      
      // Crear el objeto de comentario
      const commentData = {
        content: newComments[postId],
        userId: userId,
        postId: postId, // Añadir el postId al objeto de comentario
      };
  
      console.log('Request body:', commentData); // Imprimir el cuerpo de la solicitud en la consola
      
      const response = await fetch(`https://prueba-t1-tdi.onrender.com/posts/${postId}/comments`, {
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
      const username = await fetchUsernameById(userId);
      const commentWithUsername = {
        ...createdComment,
        username,
      };
  
      // Actualizar el estado de los comentarios de la publicación
      setPostComments(prevComments => ({
        ...prevComments,
        [postId]: [...(prevComments[postId] || []), commentWithUsername],
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

  const fetchUsernameById = async (userId) => {
    try {
      const response = await fetch(`https://prueba-t1-tdi.onrender.com/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const userData = await response.json();
      return userData.username;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return ''; 
    }
  };
  
  // Función para manejar cambios en el campo de comentario
  const handleCommentChange = (postId, comment) => {
    setNewComments({
      ...newComments,
      [postId]: comment,
    });
  };

  return (
    <div className="container">
      {user && (
        <div className="content">
          <div className="image">
            <img src={user.avatar} alt="Imagen de perfil" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
          </div>
          <div>
            <h2>Nombre de Usuario: {user.username}</h2>
          </div>
        </div>
      )}

      <Link to="/posts" className="btn">Volver a inicio</Link>

      <h1 className="title">Publicaciones</h1>
      <div className="posts-section" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {posts.length === 0 ? (
          <p>Este usuario no tiene publicaciones.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-container">
              <div className="posts-container">
                <div className="content">
                  <h3>Título: {post.title}</h3>
                  <p>Descripción: {post.content}</p>
                  <p>Autor: <Link to={`/users/${post.userId}`}>{post.username}</Link></p>
                  {post.image && <img src={post.image} alt="Post" className="image" style={{ maxWidth: '100%', maxHeight: '200px' }} />}
                </div>
              </div>
              <div className="comments-container">
                <p>Comentarios:</p>
                <div className="comments-list">
                  {postComments[post.id] && postComments[post.id].map((comment) => (
                    <div key={comment.id}>
                      <p><strong><Link to={`/users/${comment.userId}`}>{comment.username || 'Loading...'}</Link>:</strong> {comment.content}</p>
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
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;