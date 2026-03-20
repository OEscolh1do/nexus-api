const { z } = require("zod");

const LoginSchema = z.object({
  username: z.string({ required_error: "Username é obrigatório" }).min(3),
  password: z.string({ required_error: "Password é obrigatório" }).min(6)
}).strict();

module.exports = {
  LoginSchema
};
