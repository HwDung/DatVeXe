import 'package:flutter/material.dart';

import '../services/customer_service.dart';
import '../utils/formatters.dart';
import '../widgets/app_widgets.dart';
import '../widgets/remote.dart';
import 'seat_selection_screen.dart';

class TripDetailScreen extends StatelessWidget {
  const TripDetailScreen({super.key, required this.id, required this.date});
  final String id, date;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Chi tiết chuyến xe')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Remote(
          load: () => customer.trip(id),
          builder: (t) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              heading(
                '${t['route']?['origin']} → ${t['route']?['destination']}',
              ),
              Text(
                '${tripDateLabel(date)} • ${t['departureTime']} → ${t['arrivalTime']}',
              ),
              const SizedBox(height: 16),
              Text('Nhà xe: ${t['company']?['name'] ?? ''}'),
              Text('Đánh giá: ${t['company']?['rating'] ?? 'Chưa có'}'),
              Text('Loại xe: ${t['bus']?['type'] ?? ''}'),
              Text('Thời lượng: ${t['duration'] ?? ''}'),
              Text('Số chỗ: ${t['bus']?['totalSeats'] ?? ''}'),
              heading(money(t['price'])),
              FilledButton(
                onPressed: t['isActive'] == false
                    ? null
                    : () => open(
                        context,
                        SeatSelectionScreen(
                          trip: Map<String, dynamic>.from(t),
                          date: date,
                        ),
                      ),
                child: const Text('Chọn chỗ'),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
