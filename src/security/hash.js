import bcrypt from "bcrypt";
const saltRounds = process.env.SALT_ROUNDS;


// Hash Password
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, Number(saltRounds));
}

// compare password
export const comparePassword = async (password, userPass) => {
    return await bcrypt.compare(password, userPass);
}