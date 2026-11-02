import '../services/operator_service.dart';
import 'operator/operator_portal_screen.dart';

import 'package:flutter/material.dart';

import '../config/app_theme.dart';
import '../services/api_service.dart';
import '../widgets/app_widgets.dart';
import 'login_screen.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});
  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      const CircleAvatar(
        radius: 40,
        backgroundColor: Color(0xFFFEF2F2),
        child: Icon(Icons.person, size: 44, color: red),
      ),
      heading(api.user?['fullName'] ?? 'Xin chào bạn'),
      Text(api.user?['email'] ?? 'Đăng nhập để lưu hành trình của bạn'),
      const SizedBox(height: 24),
      FilledButton(
        onPressed: () async {
          if (api.user == null) {
            await open(context, const LoginScreen());
          } else {
            try {
              await api.logout();
            } catch (e) {
              if (context.mounted) notify(context, e);
            }
          }
          if (mounted) setState(() {});
        },
        child: Text(api.user == null ? 'Đăng nhập / Đăng ký' : 'Đăng xuất'),
      ),
      if (OperatorAccess.from(
        api.user?['companyMembership'] is Map
            ? Map<String, dynamic>.from(api.user!['companyMembership'])
            : null,
      ).allowed)
        OutlinedButton.icon(
          onPressed: () => open(
            context,
            Scaffold(
              appBar: AppBar(title: const Text('Khu vực làm việc')),
              body: const SafeArea(child: OperatorPortalScreen()),
            ),
          ),
          icon: const Icon(Icons.work_outline),
          label: const Text('Khu vực nhân viên / quản lý'),
        ),
      heading('Kết nối máy chủ'),
      SelectableText(api.baseUrl),
      const SizedBox(height: 12),
      const Text(
        'Có thể cấu hình địa chỉ máy chủ bằng API_BASE_URL trong file .env, rồi khởi động lại ứng dụng. Phiên đăng nhập chỉ lưu trong bộ nhớ; đóng ứng dụng sẽ cần đăng nhập lại.',
      ),
    ],
  );
}
