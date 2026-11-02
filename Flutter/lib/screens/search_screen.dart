import 'trip_detail_screen.dart';

import 'package:flutter/material.dart';

import '../config/app_theme.dart';
import '../services/customer_service.dart';
import '../widgets/trip_filters.dart';
import '../utils/formatters.dart';
import '../widgets/app_widgets.dart';
import '../widgets/remote.dart';
import 'seat_selection_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({
    super.key,
    required this.origin,
    required this.destination,
    required this.date,
  });
  final String origin, destination, date;
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
        Text(widget.date),
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
                          TripDetailScreen(id: '${t['id']}', date: widget.date),
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
                            onPressed: (t['seatsAvailable'] as num? ?? 0) <= 0
                                ? null
                                : () => open(
                                    context,
                                    SeatSelectionScreen(
                                      trip: Map<String, dynamic>.from(t),
                                      date: widget.date,
                                    ),
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
