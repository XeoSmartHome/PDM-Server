import express, {Router} from "express";
import {User} from "../database/user";
import {createHash} from "crypto";
import {Movie} from "../database/movie";
import {sign, verify} from "jsonwebtoken";
import {broadcastEvent} from "../connections";

export const APP_SECRET = "secret1234";
const generateJwtToken = (userId: string) => {
    return sign({userId}, APP_SECRET, {expiresIn: "10d"});
}

const mapMovie = (movie: any) => {
    return movie;
}

const apiRouter = Router();
apiRouter.use(express.json());

const authMiddleware = async (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return res.status(401).send();
    }
    try {
        const decoded = verify(token, APP_SECRET);
        const {userId} = decoded as { userId: string };
        if (!userId) {
            return res.status(401).send();
        }
        res.locals = {userId};
        next();
    } catch (e) {
        return res.status(401).send();
    }
}

apiRouter.post('/auth/login', async (req, res) => {
    console.log("login", req.body);
    const user = await User.findOne({email: req.body.email});

    if (!user) {
        return res.status(401).json({message: "User not found"});
    }

    const passwordHash = req.body.password;

    if (passwordHash !== user.passwordHash) {
        return res.status(401).json({message: "Invalid password"});
    }

    res.send({
        token: generateJwtToken(user.id),
    })
});

apiRouter.post("/users", (req, res) => {
    const {firstName, lastName, email, password} = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({message: "Missing required fields"});
    }

    const user = new User({
        email,
        firstName,
        lastName,
        passwordHash: createHash('sha256').update(password).digest('hex'),
    });

    user.save().then((user) => {
        res.send(user);
    }).catch((error) => {
        console.log("error", error);
        res.sendStatus(500);
    });
});


apiRouter.get("/movies", authMiddleware, async (req, res) => {
    console.log(req.query)
    const {userId} = res.locals;
    const movies = await Movie.find({userId}, {}, {limit: 5, skip: req.query.skip ?? 0});

    console.log("movies", movies.map(mapMovie).length);
    res.send(movies.map(mapMovie));
});

apiRouter.post("/movies", authMiddleware, (req, res) => {
    console.log("create movie", req.url, req.body);

    const {userId} = res.locals;

    const {title, description, year, date, location, status} = req.body;

    const movie = new Movie({
        userId,
        title,
        description,
        year,
        date,
        location,
        status,
        photo: "default.jpg",
    });

    movie.save().then((movie) => {
        res.send(mapMovie(movie));
        // broadcastEvent("created", mapMovie(movie));
    }).catch((error) => {
        console.log(error);
        res.sendStatus(500);
    });
});

apiRouter.put("/movies/:movieId", authMiddleware, (req, res) => {
    console.log("update movie", req.url, req.body);

    const {userId} = res.locals;

    const {title, description, year, date, location, status} = req.body;

    Movie.findOneAndUpdate({
        userId,
        _id: req.params.movieId,
    }, {
        title,
        description,
        year,
        date,
        location,
        status
    }, {returnDocument: "after"}).then((movie) => {
        res.send(mapMovie(movie));
        console.log("updated movie", movie);
        broadcastEvent("updated", mapMovie(movie));
    }).catch((error) => {
        console.log(error);
        res.sendStatus(500);
    });


});

apiRouter.delete("/movies/:movieId", authMiddleware, (req, res) => {
    console.log("delete movie", req.url, req.body);

    const {userId} = res.locals;

    Movie.deleteOne({
        userId,
        _id: req.params.movieId,
    }).then((movie) => {
        res.send(mapMovie(movie));
        broadcastEvent("deleted", mapMovie(movie));
    }).catch((error) => {
        console.log(error);
        res.sendStatus(500);
    });
});

export default apiRouter;
