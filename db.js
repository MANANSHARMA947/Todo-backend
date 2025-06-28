import mongoose from "mongoose";
import { object } from "zod/v4";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;


const userSchema = new Schema({
    email:String,
    firstName:String,
    lastName:String,
    password:{
        required:true,
        type:String
    }
})


const todoSchema = new Schema({
    
    userId:{
        type:ObjectId,
        ref:"user"
    },
    "title":String,
    description:String,
    status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const userModel = mongoose.model("user",userSchema)
const todoModel = mongoose.model("todo",todoSchema)



export{userModel,todoModel};