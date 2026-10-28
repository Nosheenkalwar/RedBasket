import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { AuthUser, CurrentUser, CustomerOnly } from '../common/auth';
import { AccountService } from './account.service';
import { AddressDto, UpdateProfileDto } from './dto';

@Controller('me')
@CustomerOnly()
export class AccountController {
  constructor(private account: AccountService) {}

  @Get() profile(@CurrentUser() u: AuthUser) { return this.account.profile(u.id); }
  @Patch() update(@CurrentUser() u: AuthUser, @Body() dto: UpdateProfileDto) { return this.account.updateProfile(u.id, dto); }

  @Get('addresses') addresses(@CurrentUser() u: AuthUser) { return this.account.listAddresses(u.id); }
  @Post('addresses') add(@CurrentUser() u: AuthUser, @Body() dto: AddressDto) { return this.account.addAddress(u.id, dto); }
  @Put('addresses/:id') edit(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: AddressDto) {
    return this.account.updateAddress(u.id, id, dto);
  }
  @Delete('addresses/:id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.account.removeAddress(u.id, id); }
  @Post('addresses/:id/default') makeDefault(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.account.makeDefault(u.id, id);
  }
}
