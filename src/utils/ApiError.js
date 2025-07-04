class ApiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors= [],
        stack=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data= null
        this.errors = this.errors
        this.message= false;

        if(stack){
            this.stack= stack;
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {ApiError};