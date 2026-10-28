import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class CartItemDto {
  @IsInt() productId: number;
  @IsInt() @Min(1, { message: 'Quantity must be at least 1.' }) @Max(99, { message: 'You can add up to 99 of one item.' }) quantity: number;
}

export class MergeCartDto {
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => CartItemDto) items: CartItemDto[];
}
