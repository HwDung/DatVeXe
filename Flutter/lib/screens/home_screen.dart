import '../config/config_api.dart';

import 'package:flutter/material.dart';

import '../config/app_theme.dart';
import '../services/customer_service.dart';
import '../utils/formatters.dart';
import '../widgets/app_widgets.dart';
import '../widgets/remote.dart';
import 'search_screen.dart';
import 'news_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? origin, destination;
  DateTime date = vietnamToday();
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(16),
    children: [
      Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [navy, Color(0xFF345B85)]),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.route, color: Colors.white70, size: 38),
            SizedBox(height: 18),
            Text(
              'Hành trình đẹp hơn\ncùng Rightway',
              style: TextStyle(
                fontSize: 29,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'An toàn • Đúng giờ • Thoải mái',
              style: TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ),
      heading('Bạn muốn đi đâu?'),
      Remote(
        load: () => customer.cities(),
        builder: (data) {
          final cities = List<String>.from(data as List);
          return panel(
            Column(
              children: [
                DropdownButtonFormField<String>(
                  key: ValueKey('from$origin'),
                  initialValue: origin,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Điểm đi',
                    prefixIcon: Icon(Icons.trip_origin),
                  ),
                  items: cities
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setState(() => origin = v),
                ),
                Align(
                  alignment: Alignment.centerRight,
                  child: IconButton(
                    tooltip: 'Đổi chiều',
                    onPressed: () => setState(() {
                      final temp = origin;
                      origin = destination;
                      destination = temp;
                    }),
                    icon: const Icon(Icons.swap_vert, color: red),
                  ),
                ),
                DropdownButtonFormField<String>(
                  key: ValueKey('to$destination'),
                  initialValue: destination,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Điểm đến',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                  items: cities
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setState(() => destination = v),
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_month, color: red),
                  title: const Text('Ngày khởi hành'),
                  subtitle: Text(dateKey(date)),
                  trailing: const Icon(Icons.expand_more),
                  onTap: () async {
                    final value = await showDatePicker(
                      context: context,
                      initialDate: date,
                      firstDate: vietnamToday(),
                      lastDate: vietnamToday().add(
                        Duration(days: ApiConfig.bookingAdvanceDays),
                      ),
                    );
                    if (value != null) setState(() => date = value);
                  },
                ),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {
                      if (origin == null ||
                          destination == null ||
                          origin == destination) {
                        notify(
                          context,
                          'Vui lòng chọn hai điểm đi và đến khác nhau.',
                        );
                        return;
                      }
                      open(
                        context,
                        SearchScreen(
                          origin: origin!,
                          destination: destination!,
                          date: dateKey(date),
                        ),
                      );
                    },
                    icon: const Icon(Icons.search),
                    label: const Text('Tìm chuyến xe'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      heading('Tuyến xe phổ biến'),
      Remote(
        load: () => customer.popularRoutes(),
        builder: (data) => Column(
          children: [
            if ((data as List).isEmpty) const Text('Chưa có tuyến xe.'),
            ...data.map<Widget>(
              (r) => panel(
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFEF2F2),
                    child: Icon(Icons.directions_bus, color: red),
                  ),
                  title: Text(
                    '${r['origin']} → ${r['destination']}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text('Từ ${money(r['minPrice'])}'),
                  trailing: const Icon(Icons.arrow_forward),
                  onTap: () => open(
                    context,
                    SearchScreen(
                      origin: r['origin'],
                      destination: r['destination'],
                      date: dateKey(date),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      heading('Ưu đãi nổi bật'),
      Remote(
        load: () => customer.promotions(),
        builder: (data) => Column(
          children: [
            if ((data as List).isEmpty) const Text('Hiện chưa có ưu đãi.'),
            ...data.map<Widget>(
              (p) => panel(
                ListTile(
                  leading: const Icon(Icons.local_offer_outlined, color: red),
                  title: Text(
                    '${p['title'] ?? p['code'] ?? 'Ưu đãi Rightway'}',
                  ),
                  subtitle: Text('${p['description'] ?? ''}'),
                ),
              ),
            ),
          ],
        ),
      ),
      heading('Tin tức & hành trình'),
      Remote(
        load: () => customer.news(),
        builder: (data) => Column(
          children: [
            ...(data as List)
                .take(4)
                .map<Widget>(
                  (n) => panel(
                    ListTile(
                      title: Text('${n['title']}'),
                      subtitle: Text(
                        '${n['summary'] ?? ''}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => open(context, NewsScreen(id: '${n['id']}')),
                    ),
                  ),
                ),
          ],
        ),
      ),
      const SizedBox(height: 24),
    ],
  );
}
