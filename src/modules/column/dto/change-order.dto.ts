import { IsInt, IsNotEmpty } from "class-validator";

export class ChangeOrderDto {
	@IsInt()
	@IsNotEmpty()
	newOrder: number
}