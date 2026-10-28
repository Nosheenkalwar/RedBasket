import { Controller, Get } from '@nestjs/common';
import { deliverySlots, FREE_DELIVERY_FROM, KARACHI_AREAS, ZONES } from './shipping.rules';

@Controller('shipping')
export class ShippingController {
  /** the address form and checkout use this list, so customers can only pick areas we deliver to */
  @Get('areas')
  areas() {
    return Object.entries(KARACHI_AREAS).map(([name, zone]) => ({ name, zone, zoneName: ZONES[zone].name, fee: ZONES[zone].fee }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  @Get('info')
  info() {
    return { city: 'Karachi', freeDeliveryFrom: FREE_DELIVERY_FROM, zones: ZONES, slots: deliverySlots() };
  }
}
