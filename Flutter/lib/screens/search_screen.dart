import 'trip_detail_screen.dart';

import 'package:flutter/material.dart';

import '../config/app_theme.dart';
import '../services/customer_service.dart';
import '../widgets/trip_filters.dart';
import '../utils/formatters.dart';
import '../widgets/app_widgets.dart';
import '../widgets/remote.dart';
import '../utils/booking_navigation.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({
    super.key,
    required this.origin,
    required this.destination,
    required this.date,
    this.passengers = 1,
  });
  final String origin, destination, date;
  final int passengers;
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String sort = 'departure_asc';
  Map<String, dynamic> filters = {};
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Chọn chuyến xe')),
    body: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        heading('${widget.origin} → ${widget.destination}'),
        Text('${tripDateLabel(widget.date)} • ${widget.passengers} hành khách'),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () async {
            final result = await open<Map<String, dynamic>>(
              context,
              TripFilters(initial: filters),
            );
            if (result != null && mounted) setState(() => filters = result);
          },
          icon: const Icon(Icons.tune),
          label: Text(
            filters.isEmpty ? 'Bộ lọc' : 'Bộ lọc (${filters.length})',
          ),
        ),
        DropdownButtonFormField<String>(
          initialValue: sort,
          decoration: const InputDecoration(labelText: 'Sắp xếp'),
          items: const [
            DropdownMenuItem(
              value: 'departure_asc',
              child: Text('Khởi hành sớm nhất'),
            ),
            DropdownMenuItem(value: 'price_asc', child: Text('Giá thấp nhất')),
            DropdownMenuItem(value: 'price_desc', child: Text('Giá cao nhất')),
            DropdownMenuItem(
              value: 'departure_desc',
              child: Text('Khởi hành muộn nhất'),
            ),
            DropdownMenuItem(
              value: 'rating_desc',
              child: Text('Đánh giá cao nhất'),
            ),
          ],
          onChanged: (v) => setState(() => sort = v!),
        ),
        const SizedBox(height: 16),
        Remote(
          key: ValueKey('$sort|${filters.toString()}'),
          load: () => customer.search({
            'origin': widget.origin,
            'destination': widget.destination,
            'date': widget.date,
            'sort': sort,
            ...filters,
          }),
          builder: (data) => Column(
            children: [
              if ((data as List).isEmpty)
                panel(
                  const Text(
                    'Không có chuyến phù hợp. Hãy thử ngày hoặc tuyến khác.',
                  ),
                ),
              ...data.map<Widget>(
                (t) => panel(
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (t['bus']?['image'] != null)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            '${t['bus']['image']}',
                            height: 140,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, e, st) => const SizedBox.shrink(),
                          ),
                        ),
                      if (t['isDemo'] == true)
                        const Chip(label: Text('Dữ liệu minh họa')),
                      Text(
                        '${t['company']?['name'] ?? 'Nhà xe'}',
                        style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                          color: navy,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${t['departureTime']}  ─── ${t['duration']} ───  ${t['arrivalTime']}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${t['bus']?['type'] ?? ''} • Còn ${t['seatsAvailable']} chỗ',
                      ),
                      TextButton(
                        onPressed: () => open(
                          context,
                          TripDetailScreen(
                            id: '${t['id']}',
                            date: widget.date,
                            passengers: widget.passengers,
                          ),
                        ),
                        child: const Text('Chi tiết chuyến'),
                      ),
                      const Divider(height: 28),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              money(t['price']),
                              style: const TextStyle(
                                fontSize: 22,
                                color: red,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          FilledButton(
                            onPressed:
                                (t['seatsAvailable'] as num? ?? 0) <
                                    widget.passengers
                                ? null
                                : () => chooseCustomerSeats(
                                    context,
                                    Map<String, dynamic>.from(t),
                                    widget.date,
                                    widget.passengers,
                                  ),
                            child: const Text('Chọn chỗ'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
