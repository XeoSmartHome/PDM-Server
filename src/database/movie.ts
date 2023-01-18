import mongoose from "mongoose";

interface IMovie {
    userId: string;
    title: string;
    description: string;
    year: number;
    location: string;
    photo: string;
    date: string;
    status: boolean;
}

const movieSchema = new mongoose.Schema<IMovie>({
    userId: { type: String, required: true },
    title: {type: String, required: true},
    description: {type: String, required: true},
    year: {type: Number, required: false},
    location: {type: String, required: false},
    photo: {type: String, required: false},
    date: {type: String, required: false},
    status: {type: Boolean, required: false},
});

export const Movie = mongoose.model<IMovie>("Movie", movieSchema);
