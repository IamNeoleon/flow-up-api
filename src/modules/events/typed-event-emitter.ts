import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TypedEventEmitter<T> {
   constructor(private readonly emitter: EventEmitter2) { }

   emit<K extends keyof T>(event: K, payload: T[K]) {
      return this.emitter.emit(event as string, payload);
   }

   on<K extends keyof T>(event: K, listener: (payload: T[K]) => void) {
      this.emitter.on(event as string, listener);
   }
}