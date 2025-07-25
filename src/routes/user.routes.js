
import { Router } from "express";
import { registerUser, loginUser, logOutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
    router.route("/login").post(loginUser)
    router.route("/logout").post(verifyJWT, logOutUser)
    router.route("/refresh").post(refreshAccessToken)

export default router;