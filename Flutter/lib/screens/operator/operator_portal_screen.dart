import 'package:flutter/material.dart';

import '../../services/api_service.dart';
import '../../services/operator_service.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/remote.dart';
import 'operator_bookings_screen.dart';
import 'operator_counter_screen.dart';
import 'operator_management_screens.dart';
import 'operator_qr_screen.dart';

class OperatorPortalScreen extends StatefulWidget {
  const OperatorPortalScreen({super.key, this.loadMembership});
  final Future<Map<String, dynamic>> Function()? loadMembership;
  @override
  State<OperatorPortalScreen> createState() => _OperatorPortalScreenState();
}

class _OperatorPortalScreenState extends State<OperatorPortalScreen> {
  int revision = 0;
  Widget tile(String title, String subtitle, IconData icon, Widget page) =>
      Card(
        child: ListTile(
          leading: Icon(icon),
          title: Text(title),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => open(context, page),
        ),
      );
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Row(
        children: [
          Expanded(child: heading('Khu vực làm việc')),
          IconButton(
            tooltip: 'Kiểm tra lại quyền',
            onPressed: () => setState(() => revision++),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      Remote(
        key: ValueKey(revision),
        load: widget.loadMembership ?? operatorApi.me,
        builder: (data) {
          final member = Map<String, dynamic>.from(data);
          final access = OperatorAccess.from(member);
          if (!access.allowed) {
            return const Text('Tài khoản chưa có quyền làm việc tại nhà xe.');
          }
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              panel(
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    heading('${member['company']?['name'] ?? 'Nhà xe'}'),
                    Text(
                      '${access.label} • ${api.user?['fullName'] ?? api.user?['email'] ?? ''}',
                    ),
                  ],
                ),
              ),
              tile(
                'Quản lý vé',
                'Tìm, duyệt, hủy, hoàn thành và ghi nhận thu tiền',
                Icons.confirmation_number_outlined,
                const OperatorBookingsScreen(),
              ),
              tile(
                'Thông tin khách hàng',
                'Tìm vé và cập nhật liên hệ hành khách',
                Icons.people_outline,
                const OperatorBookingsScreen(customers: true),
              ),
              tile(
                'Bán vé tại quầy',
                'Chọn chuyến, chọn ghế, thu tiền và xuất QR',
                Icons.point_of_sale,
                const OperatorCounterScreen(),
              ),
              tile(
                'Đổi ghế / chuyến',
                'Chọn vé đã thanh toán trong Quản lý vé để báo giá và đổi',
                Icons.swap_horiz,
                const OperatorBookingsScreen(),
              ),
              tile(
                'Email vé',
                'Trạng thái gửi email và yêu cầu gửi lại',
                Icons.email_outlined,
                const OperatorEmailScreen(),
              ),
              tile(
                'Quét QR xem vé',
                'Kiểm tra vé thuộc nhà xe',
                Icons.qr_code_scanner,
                const OperatorQrScreen(),
              ),
              if (access.board)
                tile(
                  'Xác nhận lên xe',
                  'Quét QR đúng chuyến và ngày khởi hành',
                  Icons.how_to_reg,
                  const OperatorQrScreen(board: true),
                ),
              if (access.manageEmployees) ...[
                tile(
                  'Quản lý nhân viên',
                  access.role == 'manager'
                      ? 'Thêm, sửa và khóa/mở nhân viên thường'
                      : 'Thêm và phân quyền quản lý/nhân viên',
                  Icons.manage_accounts,
                  OperatorEmployeesScreen(access: access),
                ),
                tile(
                  'Đối soát thanh toán',
                  'Các khoản cần kiểm tra và hoàn tiền',
                  Icons.account_balance_outlined,
                  const OperatorPaymentIssuesScreen(),
                ),
              ],
            ],
          );
        },
      ),
    ],
  );
}
