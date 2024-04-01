from typing import Union, List, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .schemas import User, Post, Comment, CreateUserRequest, LoginRequest, LoginResponse, CreatePostRequest, CreateCommentRequest
import random


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir acceso desde cualquier origen
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todos los encabezados HTTP
)
def get_user(username: str):
    if username in users_db:
        user_dict = users_db[username]
        return UserInDB(**user_dict)


# Simular la base de datos en memoria
users_db = {}
posts_db = {}
comments_db = {}

class UserInDB(User):
    password: str


#CREAR USUARIO
@app.post("/users", status_code=201, response_model=User)
async def create_user(user_data: CreateUserRequest):
    # Verificar que se proporcionen todos los parámetros requeridos
    if not user_data.username:
        raise HTTPException(status_code=400, detail="missing parameter: username")

    # Verificar si el nombre de usuario ya existe
    if user_data.username in users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    # if password shorter than 6
    if len(user_data.password) < 6:
        #invalid password: <password>
        raise HTTPException(status_code=400, detail="invalid password " + user_data.password)

    user_id = len(users_db) + 1
    created_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user = User(id=user_id, username=user_data.username, avatar=user_data.avatar, created=created_date)
    users_db[user_data.username] = user.dict()
    users_db[user_data.username]["password"] = user_data.password


    return user

def authenticate_user(username: str, password: str):
    user = users_db.get(username)
    if user:
        return user.get("password") == password
    return False

#LOGGEAR USUARIO
@app.post("/login", response_model=LoginResponse)
async def login_user(login_data: LoginRequest):

    # Verificar que se proporcionen todos los parámetros requeridos
    if not login_data.username:
        raise HTTPException(status_code=400, detail="missing parameter: username")
    if not login_data.password:
        raise HTTPException(status_code=400, detail="missing parameter: password")

    # Verificar si el usuario existe en la base de datos
    if not authenticate_user(login_data.username, login_data.password):
        raise HTTPException(status_code=400, detail="incorrect email or password")
    
    return LoginResponse(user=User(**users_db[login_data.username]))


#OBTENER USUARIOS
@app.get("/users", response_model=List[User])
async def get_users(name: Optional[str] = None):
    if name:
        filtered_users = [user_data for username, user_data in users_db.items() if user_data["username"] == name]
        if not filtered_users:
            raise HTTPException(status_code=404, detail="User not found")
        return filtered_users
    else:
        return list(users_db.values())

@app.get("/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: int):
    for user_data in users_db.values():
        if user_data.get("id") == user_id:
            return user_data
    raise HTTPException(status_code=404, detail="User not found")
    


#CREAR POST
@app.post("/posts", status_code=201, response_model=Post)
async def create_post(post_data: CreatePostRequest):

    if not post_data.content:
        raise HTTPException(status_code=400, detail="missing parameter: content")


    user_found = False
    for user_data in users_db.values():
        if user_data.get("id") == post_data.userId:
            user_found = True
            break

    if not user_found:
        raise HTTPException(status_code=404, detail=f"user with id {post_data.userId} does not exist")
    
    
    post_id = len(posts_db) + 1
    created_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_post = Post(
        id=post_id,
        title=post_data.title,
        content=post_data.content,
        image=post_data.image,
        userId=post_data.userId,
        created=created_date
    )
    posts_db[post_id] = new_post
    return new_post

#OBTENER POSTS
@app.get("/posts", response_model=List[Post])
async def get_posts(title: Optional[str] = None, userId: Optional[int] = None, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None):

    filtered_posts = []
    for post in posts_db.values():
        if title and title not in post.title:
            continue
        if userId and userId != post.userId:
            continue
        if from_date and from_date > datetime.fromisoformat(post.created):
            continue
        if to_date and to_date < datetime.fromisoformat(post.created):
            continue
        filtered_posts.append(post)
    return filtered_posts


# Crear comentario
@app.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(comment_data: CreateCommentRequest):

    # Verificar que se proporcionen todos los parámetros requeridos
    if not comment_data.content:
        raise HTTPException(status_code=400, detail="missing parameter: content")


    # Verificar que el post exista
    if comment_data.postId not in posts_db:
        raise HTTPException(status_code=404, detail=f"post with id {comment_data.postId} not found")

    user_found = False
    for user_data in users_db.values():
        if user_data.get("id") == comment_data.userId:
            user_found = True
            break

    if not user_found:
        raise HTTPException(status_code=404, detail=f"user with id {comment_data.userId} not found")

    # Crear el comentario
    comment_id = len(comments_db) + 1
    created_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_comment = Comment(
        id=comment_id,
        content=comment_data.content,
        userId=comment_data.userId,
        postId=comment_data.postId,
        created=created_date
    )
    comments_db[comment_id] = new_comment
    return new_comment


# Crear comentario SIN POST ID -> Pedido por enunciado
@app.post("/comments", status_code=201)
async def create_comment(comment_data: CreateCommentRequest):

    # Verificar que se proporcionen todos los parámetros requeridos
    if not comment_data.content:
        raise HTTPException(status_code=400, detail="missing parameter: content")
    if not comment_data.userId:
        raise HTTPException(status_code=400, detail="missing parameter: userId")
    if not comment_data.postId:
        raise HTTPException(status_code=400, detail="missing parameter: postId")

    # Verificar que el post exista
    if comment_data.postId not in posts_db:
        raise HTTPException(status_code=404, detail=f"post with id {comment_data.postId} not found")

    user_found = False
    for user_data in users_db.values():
        if user_data.get("id") == comment_data.userId:
            user_found = True
            break

    if not user_found:
        raise HTTPException(status_code=404, detail=f"user with id {comment_data.userId} not found")

    # Crear el comentario
    comment_id = len(comments_db) + 1
    created_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_comment = Comment(
        id=comment_id,
        content=comment_data.content,
        userId=comment_data.userId,
        postId=comment_data.postId,
        created=created_date
    )
    comments_db[comment_id] = new_comment
    return new_comment



#OBTENER COMENTARIOS
@app.get("/posts/{post_id}/comments", response_model=List[Comment])
async def get_comments(post_id: int):

    # Verificar que el post exista
    if post_id not in posts_db:
        print(posts_db)
        raise HTTPException(status_code=404, detail="Post not found")
    
    filtered_comments = []
    for comment in comments_db.values():
        if post_id and post_id != comment.postId:
            continue
        filtered_comments.append(comment)
    return filtered_comments

#OBTENER COMENTARIOS SIN POSTID-> Pedido por enunciado
@app.get("/comments", response_model=List[Comment])
async def get_comments():
    return list(comments_db.values())




# Endpoint para resetear datos
@app.post("/reset", status_code=200)
async def reset_state():
    global users_db, posts_db, comments_db
    users_db.clear()
    posts_db.clear()
    comments_db.clear()
    return {}


@app.post("/populate", status_code=200)
async def populate_data():
    global users_db, posts_db, comments_db

    # Resetear las bases de datos
    users_db.clear()
    posts_db.clear()
    comments_db.clear()

    # Enlaces de avatares proporcionados
    avatar_links = [
        "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=626&ext=jpg",
        "https://img.freepik.com/premium-psd/business-woman-3d-cartoon-avatar-portrait_627936-23.jpg?size=626&ext=jpg",
        "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436180.jpg?size=626&ext=jpg",
        "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?size=626&ext=jpg",
        "https://img.freepik.com/premium-psd/3d-atlet-avatar_10376-855.jpg?size=626&ext=jpg",
        "https://img.freepik.com/premium-psd/3d-judge-avatar_10376-868.jpg?size=626&ext=jpg",
        "https://img.freepik.com/premium-psd/3d-avatar-hip-hop-music-fans_10376-849.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=ais",
        "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671153.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=ais",
        "https://img.freepik.com/free-psd/cool-man-3d-cartoon-avatar-portrait_627936-10.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=ais",
        "https://img.freepik.com/premium-psd/3d-avatar-emo-music-fans_10376-848.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=ais"
    ]

    # Links de imágenes de posts proporcionados
    # Cualquiera de estos puede salir al azar, a cada usuario se le asignan 5 
    post_image_links = [
        "https://img.freepik.com/free-photo/two-rabbits-are-sitting-easter-eggs-one-has-blue-green-face_1340-30377.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=sph",
        "https://img.freepik.com/free-photo/free-photo-flowers-blossom-floral-bouquet-decoration-colorful-beautiful-background-garden-flowers-plant-pattern_1340-26141.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=sph",
        "https://img.freepik.com/premium-photo/dragonfly-realistic-imge-aspectgenerative-ai_760510-9330.jpg?size=626&ext=jpg&ga=GA1.2.1286897121.1711204625&semt=sph",
        "https://img.freepik.com/free-photo/vertical-shot-huilo-huilo-waterfall-southern-chile_181624-34864.jpg?t=st=1711209230~exp=1711212830~hmac=f267f4a42a8374108762a87607bf5b60a479594792ef41738e63c07e57a82d68&w=740",
        "https://img.freepik.com/premium-photo/scenic-view-sea-mountains-against-blue-sky_1048944-28734633.jpg?w=1380",

        "https://img.freepik.com/free-photo/aerial-view-mountain-covered-fog-beautiful-pink-sky_181624-4676.jpg?t=st=1711233853~exp=1711237453~hmac=6b3f7daacba6ea997ebf61c4b90c28eeb24f59f997cf3796c0b5ac2d79391270&w=740",
        "https://img.freepik.com/premium-photo/background-beautiful-mountain-landscape_151223-17.jpg?w=1380",
        "https://img.freepik.com/free-photo/beautiful-view-tall-trees-blue-sky_181624-13804.jpg?t=st=1711233910~exp=1711237510~hmac=e7427832b65ca33cdbfebc8360c99fda8b64a40bdb4a05ca0c6f6be0afa8e1a4&w=900",
        "https://img.freepik.com/free-photo/beautiful-view-sky-sunset-beach_158538-26139.jpg?t=st=1711233925~exp=1711237525~hmac=ea39d1bd96292e7fd0bfa4deb1162818633026984c0a0cd42852479f5e19cf25&w=740",
        "https://img.freepik.com/free-vector/hand-drawn-flat-design-mountain-landscape_52683-79195.jpg?t=st=1711233938~exp=1711237538~hmac=7332286d8ad9a7239288a958abc4e7a1e438f27da972fde000e75cf6b28077a8&w=740",

        "https://img.freepik.com/free-photo/beautiful-mountains-landscape_23-2151151050.jpg?t=st=1711233961~exp=1711237561~hmac=ddcbf7bb85120f458e79d84d1fd030623e5a43868861368a8360f5466426be36&w=996",
        "https://img.freepik.com/free-vector/simple-nature-landscape_1308-25333.jpg?t=st=1711233973~exp=1711237573~hmac=76d23cd443bceb17c1d2ed3102fafeb9786899b3f07880b55db97db327c1a6d3&w=900",
        "https://img.freepik.com/premium-vector/flat-illustration-inspired-by-mountains-lake-vibes_990404-1610.jpg?w=740",
        "https://img.freepik.com/free-photo/cascade-boat-clean-china-natural-rural_1417-1356.jpg?t=st=1711233996~exp=1711237596~hmac=b431bb45242cb63e29f575512dd418f26cd8a5a555b70d2f1723d5a753f73581&w=826",
        "https://img.freepik.com/free-photo/pier-lake-hallstatt-austria_181624-44201.jpg?t=st=1711234011~exp=1711237611~hmac=0544bd5bfc451764c560ee40ea44e14998fdbd96681bdc5d3a0083cdc19838eb&w=826"
    
    ]

    # Usuarios
    usernames = [
        "Pablito", "Lucas", "Martin", "Pedro", "Rodrigo",
        "Amanda", "Rigoberta", "Catalina", "Messi", "Ronaldo"
    ]

    # Títulos de las publicaciones
    titles = [
        "Mi fotaza", "Esta esta buena", "Miren lo que vi",
        "Me gusta mucho esto", "mireeen"
    ]

    # Descripciones de las publicaciones
    descriptions = [
        "Miren que buena", "me gusta los colores", "esto es una foto",
        "observen", "hola hola", "cachense esta", "miren miren",
        "que lindo", "que bakan", "que buenaa", "que buenaa foto",
        "que buenaa imagen", "que buenaa publicacion", "que buenaa foto",
        "cosas que pasan", "esto es oro", "esto es fuego", "esto es fuego fuego",
        "aaaaa", "bbbb", "cccc", "dddd", "eeee", "ffff", "gggg", "hhhh", "iiii", "jjjj",
        "miaaauu", "guauu", "que lindoo", "que bakan", "me gusta", "que buenaa"
    ]

    # Comentarios
    comments = [
        "comentario aaa", "q lindo el futbol", "hola soy yoo",
        "me gustoo", "que lindo", "que bakan", "buena foto",
        "ayy me gustaa", "fuego fuego", "esto es oro",
        "grande alexis sanchez", "amo taller de integracion",
        "vamo chilee", "rellenoo", "buen photoshopp",
        "que fotaza por diosss", "me encantaa", "hola como estan",
        "comentario genericoo", "aaaaa", "q lindo", "soy seco",
        "tengo hambre", "tengo sed", "quiero pan", "quiero agua",
        "aloo", "hola hola", "que onda", "que tal", "que lindoo",
        "que bakan", "me gusta", "que buenaa", "que buenaa foto",
        "que buenaa imagen", "que buenaa publicacion", "que buenaa foto",
        "messiii", "ronaldo", "messi vs ronaldo", "ronaldo vs messi",
        "aaaaaa", "bbbbbb", "cccccc", "dddddd", "eeeeee", 
        "ffffff", "gggggg", "hhhhhh", "iiiiii", "jjjjjj",
        "kkkkkk", "llllll", "mmmmmm", "nnnnnn", "oooooo"
    ]

    # Crear usuarios
    for username, avatar_link in zip(usernames, avatar_links):
        user_id = len(users_db) + 1
        created = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
        user = User(id=user_id, username=username, avatar=avatar_link, created=created)
        users_db[username] = user.dict()
        users_db[username]["password"] = "password"

    # Poblar datos de publicaciones y comentarios
    posts_per_user = 5  # Número de publicaciones por usuario

    for username in usernames:
        user_id = users_db[username]["id"]
        user_posts = random.sample(titles, posts_per_user)  # Elegir aleatoriamente 5 títulos para cada usuario
        for title in user_posts:
            post_id = len(posts_db) + 1
            content = random.choice(descriptions)
            post_image_link = random.choice(post_image_links)  # Elegir aleatoriamente un enlace de imagen
            created = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
            post = Post(id=post_id, title=title, content=content, image=post_image_link, userId=user_id, created=created)
            posts_db[post_id] = post

            # Añadir 5 comentarios para cada publicación
            for _ in range(5):
                comment_id = len(comments_db) + 1
                comment_content = random.choice(comments)
                created = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
                comment = Comment(id=comment_id, content=comment_content, userId=random.randint(1, len(usernames)), postId=post_id, created=created)
                comments_db[comment_id] = comment

    return {}




