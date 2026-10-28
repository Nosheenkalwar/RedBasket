import { IsBoolean, IsEmail, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { NAME } from '../auth/dto';

export class StaffDto {
  @Length(3, 60, { message: 'Enter the full name (3 to 60 letters).' }) @Matches(NAME, { message: 'Names can only have letters.' }) fullName: string;
  @IsEmail({}, { message: 'Enter a valid work email.' }) email: string;
  @ValidateIf((o) => !!o.phone) @Matches(/^3\d{9}$/, { message: 'Phone should be 10 digits starting with 3.' }) phone?: string;
  @IsIn(['SUB_ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF'], { message: 'Choose a role.' }) role: 'SUB_ADMIN' | 'INVENTORY_STAFF' | 'SALES_STAFF';
}

export class CategoryDto {
  @Length(2, 40, { message: 'Name should be 2 to 40 characters.' }) name: string;
  @IsOptional() @IsInt() parentId?: number | null;
}

export class CategoryUpdateDto {
  @IsOptional() @Length(2, 40, { message: 'Name should be 2 to 40 characters.' }) name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ProductDto {
  @Length(2, 80, { message: 'Name should be 2 to 80 characters.' }) name: string;
  @Matches(/^[A-Z0-9-]{3,20}$/, { message: 'SKU: 3 to 20 capital letters, numbers or dashes, like RB-1050.' }) sku: string;
  @Length(1, 40, { message: 'Enter the brand.' }) brand: string;
  @IsInt({ message: 'Choose a sub-category.' }) categoryId: number;
  @IsNumber({}, { message: 'Enter the price.' }) @Min(1, { message: 'Price must be more than 0.' }) @Max(1_000_000) price: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number | null;
  @Length(1, 30, { message: 'Enter the unit, like 1 kg or each.' }) unit: string;
  @IsInt() @Min(1, { message: 'Lead time is at least 1 day.' }) @Max(90) leadTimeDays: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() imageUrl?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class StockInDto {
  @IsInt() productId: number;
  @IsInt({ message: 'Quantity must be a whole number.' }) @Min(1, { message: 'Quantity must be at least 1.' }) @Max(100000) quantity: number;
  @IsOptional() @IsString() @MaxLength(150) note?: string;
}

export class StockAdjustDto {
  @IsInt() productId: number;
  @IsInt({ message: 'Enter the counted quantity.' }) @Min(0, { message: 'Stock cannot go below zero.' }) @Max(100000) newQuantity: number;
  @Length(3, 150, { message: 'Write a short reason, like "Monthly stock count".' }) reason: string;
  @IsOptional() @IsInt() @Min(0) @Max(10000) reorderPoint?: number;
}
