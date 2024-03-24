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
      const response = await fetch('https://prueba-t1-tdi.onrender.com/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch All posts');
      }
      const postData = await response.json();
  
      // Obtener los nombres de usuario para cada ID de usuario en los posts
      const postsWithUsernames = await Promise.all(postData.map(async (post) => {
        try {
          const userResponse = await fetch(`https://prueba-t1-tdi.onrender.com/users/${post.userId}`);
          if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
          }
          const userData = await userResponse.json();
          return {
            ...post,
            username: userData.username 
          };
        } catch (error) {
          console.error('Error fetching user data:', error);
          return post; 
        }
      }));
  
      // Ordenar las publicaciones de más reciente a más antiguo
      postsWithUsernames.sort((a, b) => {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        return dateB - dateA;
      });
  
      // Obtener comentarios de cada publicación
      const comments = {};
      for (const post of postsWithUsernames) {
        const commentsResponse = await fetch(`https://prueba-t1-tdi.onrender.com/posts/${post.id}/comments`);
        if (!commentsResponse.ok) {
          throw new Error(`Failed to fetch comments for post ${post.id}`);
        }
        const postComments = await commentsResponse.json();
        
        // Obtener el nombre de usuario para cada comentario
        const commentsWithUsername = await Promise.all(postComments.map(async (comment) => {
          try {
            const username = await fetchUsernameById(comment.userId);
            return {
              ...comment,
              username,
            };
          } catch (error) {
            console.error('Error fetching username:', error);
            // Si hay un error al obtener el nombre de usuario, devolver el comentario sin nombre de usuario
            return comment;
          }
        }));
  
        comments[post.id] = commentsWithUsername;
      }
  
      setPosts(postsWithUsernames);
      setPostComments(comments); // Actualizar el estado con los comentarios que incluyen nombres de usuario
    } catch (error) {
      console.error('Error fetching All posts:', error);
    }
  };

  // Función para obtener el nombre de usuario por ID
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

  const handleSearchPost = async () => {
    try {
      const response = await fetch(`https://prueba-t1-tdi.onrender.com/posts?title=${encodeURIComponent(searchTermPost)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      const filteredPosts = data.filter(post => post.title.toLowerCase() === searchTermPost.toLowerCase());
      if (filteredPosts && filteredPosts.length > 0) {
        setSearchResultsPost(filteredPosts);
        setShowPostResult(true); // Hay resultados
        console.log('Resultados:', filteredPosts);
      } else {
        console.log('No hay resultados');
        setSearchResultsPost([]); // No hay resultados
        setShowPostResult(true); // Mostrar el mensaje "No hay publicaciones con ese título"
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleSearchUser = async () => {
    try {
      const response = await fetch(`https://prueba-t1-tdi.onrender.com/users?name=${searchTermUser}`);
      if (!response.ok) {
        if (response.status === 404) {
          setSearchResultsUser([]); // No hay resultados
          setShowUserResult(true);
          return;
        } else {
          throw new Error('Failed to fetch users');
        }
      }
      const data = await response.json();
      setSearchResultsUser(data);
      setShowUserResult(data.length > 0);
    } catch (error) {
      console.error('Error fetching users:', error);
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
  
  
  

  // Función para manejar la creación de un nuevo post
  const createNewPost = async () => {
    try {

      const response = await fetch('https://prueba-t1-tdi.onrender.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          image,
          userId
        })
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
    const updateCommentsWithUsername = async () => {
      const updatedComments = {};
      for (const postId in postComments) {
        const commentsWithUsername = await Promise.all(postComments[postId].map(async (comment) => {
          try {
            const username = await fetchUsernameById(comment.userId);
            return {
              ...comment,
              username,
            };
          } catch (error) {
            console.error('Error fetching username:', error);
            // Si hay un error al obtener el nombre de usuario, devolver el comentario sin nombre de usuario
            return comment;
          }
        }));
        updatedComments[postId] = commentsWithUsername;
      }
      // Actualizar el estado solo si el valor ha cambiado
      if (JSON.stringify(updatedComments) !== JSON.stringify(postComments)) {
        setPostComments(updatedComments);
      }
    };
  
    fetchAllPosts();
    updateCommentsWithUsername();
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

      <div className="search-bar">
        <h1>Barra de busqueda de publicacion:</h1>
        <input
          type="text"
          placeholder="Buscar publicación"
          value={searchTermPost}
          onChange={(e) => setSearchTermPost(e.target.value)}
          className="input"
        />
        <button onClick={handleSearchPost} className="btn">Buscar</button>
      </div>

      {showPostResult && (
        <div>
          <h2>Publicaciones encontradas:</h2>
          <div className="posts-section" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {searchResultsPost.length > 0 ? (
              searchResultsPost.map(post => (
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
                          <p>
                            <strong>
                              <Link to={`/users/${comment.userId}`}>
                                {comment.username || 'Loading...'}
                              </Link>
                            </strong>: {comment.content}
                          </p>
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
            ) : (
              <p>No hay publicaciones con ese título</p>
            )}
          </div>
        </div>
      )}

      <h1>Barra de busqueda de usuario:</h1>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar usuario"
          value={searchTermUser}
          onChange={(e) => setSearchTermUser(e.target.value)}
          className="input"
        />
        <button onClick={handleSearchUser} className="btn">Buscar</button>
      </div>

      {showUserResult && (
        <div>
          <h2>Usuarios encontrados:</h2>
          {Array.isArray(searchResultsUser) && searchResultsUser.length > 0 ? (
            <div>
              {searchResultsUser.map(user => (
                <Link key={user.id} to={`/users/${user.id}`}>
                  <button className="btn">{user.username}</button>
                </Link>
              ))}
            </div>
          ) : searchResultsUser === "No hay resultados" ? (
            <p>No hay resultados</p>
          ) : (
            <p>No se encuentran usuarios con ese nombre</p>
          )}
        </div>
      )}

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
                {post.image && <img src={post.image} alt="Post" className="image" style={{ maxWidth: '100%', maxHeight: '200px' }} />}
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
                          {comment.username || 'Loading...'}
                        </Link>
                      </strong>: {comment.content}
                    </p>
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