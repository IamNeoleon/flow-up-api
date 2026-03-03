import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
	@IsNotEmpty()
	@IsEmail()
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	email: string

	@IsNotEmpty()
	@IsString()
	@MinLength(2)
	@MaxLength(100)
	fullName: string

	@IsNotEmpty()
	@IsString()
	username: string

	@IsNotEmpty()
	@IsString()
	@MinLength(8)
	password: string
}