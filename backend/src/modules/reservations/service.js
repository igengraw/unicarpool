import { randomUUID } from 'node:crypto';
import { userClient } from '../../config/supabase.js';
import { HttpError } from '../../shared/httpError.js';
import { throwIfError } from '../../shared/dbError.js';
import { eventBus } from '../../shared/events/eventBus.js';

const COLUMNS = 'id, status, created_at, trip:trips(id, origin, destination, departure_time, status, driver:profiles(full_name))';

export async function listMine(token, userId) {
  const { data, error } = await userClient(token).from('reservations').select(COLUMNS)
    .eq('passenger_id', userId).order('created_at', { ascending: false });
  throwIfError(error);
  return data;
}

export async function getOne(token, id) {
  const { data, error } = await userClient(token).from('reservations').select(COLUMNS).eq('id', id).single();
  throwIfError(error);
  return data;
}

export async function reserve(token, tripId, clientFactory = userClient, eventPublisher = eventBus.publish) {
  if (!tripId) throw new HttpError(400, 'tripId is required');

  const { data, error } = await clientFactory(token).rpc('reserve_seat', {
    p_trip_id: tripId
  });

  throwIfError(error);

  await eventPublisher({
    eventId: randomUUID(),
    eventType: 'ReservationCreated',
    reservationId: data.id,
    tripId: data.trip_id,
    occurredAt: new Date().toISOString()
  });

  return data;
}

export async function cancel(token, id) {
  const { data, error } = await userClient(token).rpc('cancel_reservation', { p_reservation_id: id });
  throwIfError(error);
  return data;
}
