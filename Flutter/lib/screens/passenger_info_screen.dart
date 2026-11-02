import '../services/customer_service.dart';
import 'login_screen.dart';

import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../utils/formatters.dart';
import '../widgets/app_widgets.dart';
import 'booking_detail_screen.dart';

class PassengerInfoScreen extends StatefulWidget {
  const PassengerInfoScreen({
    super.key,
    required this.trip,
    required this.date,
    required this.seats,
  });
  final Map<String, dynamic> trip;
  final String date;
  final List<String> seats;
  @override
  State<PassengerInfoScreen> createState() => _PassengerInfoScreenState();
}

class _PassengerInfoScreenState extends State<PassengerInfoScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController(text: api.user?['fullName'] ?? '');
  final phone = TextEditingController();
  final email = TextEditingController(text: api.user?['email'] ?? '');
  String method = 'cash';
  bool busy = false;
  @override
  void dispose() {
    name.dispose();
    phone.dispose();
    email.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    if (!form.currentState!.validate()) return;
    setState(() => busy = true);
    try {
      if (method == 'vnpay') {
        final capabilities = await customer.capabilities();
        if (capabilities['vnpay'] != true) {
          if (mounted) {
            notify(
              context,
              'Backend chưa cấu hình VNPAY. Vui lòng chọn phương thức khác.',
            );
          }
          return;
        }
      }
      final booking = await customer.createBooking({
        'tripId': widget.trip['id'],
        'tripDate': widget.date,
        'seatCodes': widget.seats,
        'passengerName': name.text.trim(),
        'passengerPhone': phone.text.trim(),
        'passengerEmail': email.text.trim(),
        'paymentMethod': method,
      });
      if (!mounted) return;
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) =>
              BookingDetailScreen(booking: Map<String, dynamic>.from(booking)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      if (e is ApiException && e.status == 401) {
        notify(context, 'Phiên đã hết hạn. Đăng nhập lại rồi xác nhận đặt vé.');
        await open(context, const LoginScreen());
      } else if (e is ApiException && e.status == 409) {
        notify(context, '$e. Vui lòng chọn lại ghế.');
        Navigator.pop(context);
      } else {
        notify(context, e);
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Thông tin & đặt vé')),
    body: Form(
      key: form,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          heading('Thông tin hành khách'),
          TextFormField(
            controller: name,
            decoration: const InputDecoration(labelText: 'Họ tên'),
            maxLength: 120,
            validator: requiredValue,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Số điện thoại'),
            maxLength: 20,
            validator: (v) =>
                RegExp(r'^\+?[0-9]{9,15}$').hasMatch(v?.trim() ?? '')
                ? null
                : 'Nhập số điện thoại hợp lệ',
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email (tùy chọn)'),
            validator: (v) =>
                v!.trim().isEmpty ||
                    (v.trim().length <= 254 &&
                        RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                            .hasMatch(v.trim()))
                ? null
                : 'Email không hợp lệ',
          ),
          heading('Phương thức thanh toán'),
          DropdownButtonFormField<String>(
            initialValue: method,
            items: const [
              DropdownMenuItem(
                value: 'cash',
                child: Text('Tiền mặt tại nhà xe'),
              ),
              DropdownMenuItem(
                value: 'bank_transfer',
                child: Text('Chuyển khoản • xác nhận thủ công'),
              ),
              DropdownMenuItem(value: 'vnpay', child: Text('VNPAY sandbox')),
            ],
            onChanged: busy ? null : (v) => setState(() => method = v!),
          ),
          const SizedBox(height: 16),
          panel(
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.trip['route']?['origin']} → ${widget.trip['route']?['destination']}',
                ),
                Text('${widget.date} • ${widget.trip['departureTime']}'),
                Text('Ghế: ${widget.seats.join(', ')}'),
                heading(
                  money((widget.trip['price'] as num) * widget.seats.length),
                ),
                const Text(
                  'Giá và tình trạng ghế sẽ được máy chủ kiểm tra khi đặt vé. Chọn phương thức chưa có nghĩa là đã thanh toán.',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: busy ? null : submit,
            child: Text(busy ? 'Đang đặt vé…' : 'Xác nhận đặt vé'),
          ),
        ],
      ),
    ),
  );
}
