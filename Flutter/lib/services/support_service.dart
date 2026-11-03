import 'api_service.dart';
import 'customer_service.dart';

class SupportService {
  SupportService(ApiService client) : transport = CustomerService(client);
  final CustomerService transport;
  String path(bool staff) =>
      staff ? '/support/staff/conversations' : '/support/conversations';
  Future<Map<String, dynamic>> guides() => transport.object('/support/guides');
  Future<Map<String, dynamic>> ask(String message) => transport.object(
    '/support/chat',
    method: 'POST',
    body: {'message': message},
  );
  Future<List<dynamic>> companies() => transport.list('/support/companies');
  Future<List<dynamic>> conversations(bool staff) =>
      transport.list(path(staff));
  Future<Map<String, dynamic>> detail(String id, bool staff) =>
      transport.object('${path(staff)}/${Uri.encodeComponent(id)}');
  Future<Map<String, dynamic>> create(String companyId, String content) =>
      transport.object(
        path(false),
        method: 'POST',
        body: {'companyId': companyId, 'content': content},
      );
  Future<Map<String, dynamic>> reply(String id, bool staff, String content) =>
      transport.object(
        '${path(staff)}/${Uri.encodeComponent(id)}/messages',
        method: 'POST',
        body: {'content': content},
      );
  Future<Map<String, dynamic>> close(String id, bool staff) => transport.object(
    '${path(staff)}/${Uri.encodeComponent(id)}/close',
    method: 'PATCH',
    body: {},
  );
}

final support = SupportService(api);
