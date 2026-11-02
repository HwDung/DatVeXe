import 'api_service.dart';
import 'customer_service.dart';

/// Mirrors operator.routes.js. companyId always comes from backend membership.
class OperatorAccess {
  const OperatorAccess(this.role, this.isActive);
  final String role;
  final bool isActive;
  factory OperatorAccess.from(Map<String, dynamic>? member) =>
      OperatorAccess('${member?['role'] ?? ''}', member?['isActive'] == true);
  bool get allowed => isActive && ['staff', 'manager', 'owner'].contains(role);
  bool get manageEmployees => allowed && ['manager', 'owner'].contains(role);
  bool get board => allowed && role == 'staff';
  String get label =>
      const {
        'staff': 'Nhân viên',
        'manager': 'Quản lý',
        'owner': 'Chủ nhà xe',
      }[role] ??
      'Chưa có quyền';
}

class OperatorService {
  OperatorService(ApiService client) : transport = CustomerService(client);
  final CustomerService transport;
  String id(String value) => Uri.encodeComponent(value);
  Future<Map<String, dynamic>> me() => transport.object('/operator/me');
  Future<List<dynamic>> bookings({
    Map<String, dynamic>? query,
    bool customers = false,
  }) => transport.list(
    customers ? '/operator/customers' : '/operator/bookings',
    query: query,
  );
  Future<Map<String, dynamic>> status(String bookingId, String status) =>
      transport.object(
        '/operator/bookings/${id(bookingId)}/status',
        method: 'PATCH',
        body: {'status': status},
      );
  Future<Map<String, dynamic>> payment(
    String bookingId,
    Map<String, dynamic> body,
  ) => transport.object(
    '/operator/bookings/${id(bookingId)}/payment',
    method: 'POST',
    body: body,
  );
  Future<Map<String, dynamic>> contact(
    String bookingId,
    Map<String, dynamic> body,
  ) => transport.object(
    '/operator/customers/${id(bookingId)}',
    method: 'PATCH',
    body: body,
  );
  Future<List<dynamic>> employees() => transport.list('/operator/employees');
  Future<Map<String, dynamic>> createEmployee(Map<String, dynamic> body) =>
      transport.object('/operator/employees', method: 'POST', body: body);
  Future<Map<String, dynamic>> updateEmployee(
    String membershipId,
    Map<String, dynamic> body,
  ) => transport.object(
    '/operator/employees/${id(membershipId)}',
    method: 'PATCH',
    body: body,
  );
  Future<List<dynamic>> emailJobs() => transport.list('/operator/email-jobs');
  Future<Map<String, dynamic>> resend(String bookingId) => transport.object(
    '/operator/bookings/${id(bookingId)}/resend-email',
    method: 'POST',
    body: {},
  );
  Future<List<dynamic>> paymentIssues() =>
      transport.list('/operator/payment-issues');
  Future<List<dynamic>> trips() => transport.list('/operator/counter/trips');
  Future<Map<String, dynamic>> sale(Map<String, dynamic> body) =>
      transport.object('/operator/counter/sales', method: 'POST', body: body);
  Future<Map<String, dynamic>> quote(
    String bookingId,
    Map<String, dynamic> body,
  ) => transport.object(
    '/operator/bookings/${id(bookingId)}/exchange/quote',
    method: 'POST',
    body: body,
  );
  Future<Map<String, dynamic>> exchange(
    String bookingId,
    Map<String, dynamic> body,
  ) => transport.object(
    '/operator/bookings/${id(bookingId)}/exchange',
    method: 'POST',
    body: body,
  );
  Future<Map<String, dynamic>> inspect(String qr) => transport.object(
    '/operator/qr/inspect',
    method: 'POST',
    body: {'qr': qr},
  );
  Future<Map<String, dynamic>> board(
    String qr,
    String tripId,
    String tripDate,
  ) => transport.object(
    '/operator/qr/board',
    method: 'POST',
    body: {'qr': qr, 'tripId': tripId, 'tripDate': tripDate},
  );
}

final operatorApi = OperatorService(api);
