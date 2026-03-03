import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypedEventEmitter } from './typed-event-emitter';

@Module({
   imports: [
      EventEmitterModule.forRoot({
         wildcard: false,
         delimiter: '.',
         maxListeners: 20,
      }),
   ],
   providers: [TypedEventEmitter],
   exports: [TypedEventEmitter],
})
export class EventsModule { }
