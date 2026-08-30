import 'dart:async';

/// Integrates with external booking/ticketing APIs (e.g. for museums, restaurants).
abstract class IBookingService {
  Future<bool> createBooking(String resourceId, Map<String, dynamic> userDetails);
  Future<List<Map<String, dynamic>>> getAvailableSlots(String resourceId);
}
