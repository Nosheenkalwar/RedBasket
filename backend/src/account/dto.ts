import { Equals, IsBoolean, IsEmail, IsIn, IsOptional, Length, Matches, ValidateIf } from 'class-validator';
import { KARACHI_AREAS } from '../shipping/shipping.rules';
import { NAME } from '../auth/dto';

export class UpdateProfileDto {
  @Length(2, 30, { message: 'First name should be 2 to 30 letters.' }) @Matches(NAME, { message: 'Names can only have letters.' }) firstName: string;
  @Length(2, 30, { message: 'Last name should be 2 to 30 letters.' }) @Matches(NAME, { message: 'Names can only have letters.' }) lastName: string;
  @ValidateIf((o) => !!o.email) @IsEmail({}, { message: 'Enter a valid email or leave it empty.' }) email?: string;
}

export class AddressDto {
  @Length(2, 30, { message: 'Label should be 2 to 30 characters, like Home or Office.' }) label: string;
  @Length(5, 150, { message: 'Add the house number, street and a landmark (5 to 150 characters).' }) addressLine: string;
  // shipping rule 1: we only deliver inside Karachi, to the areas in the list
  @IsIn(Object.keys(KARACHI_AREAS), { message: 'Choose your area from the list. We deliver only within Karachi.' }) area: string;
  @Equals('Karachi', { message: 'We deliver only within Karachi for now.' }) city: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
