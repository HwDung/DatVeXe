import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../services/operator_service.dart';
import '../config/app_theme.dart';
import 'home_screen.dart';
import 'my_bookings_screen.dart';
import 'booking_lookup_screen.dart';
import 'account_screen.dart';
import 'operator/operator_portal_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int index = 0;
  bool wasOperator = false;
  bool get hasWork => OperatorAccess.from(
    api.user?['companyMembership'] is Map
        ? Map<String, dynamic>.from(api.user!['companyMembership'])
        : null,
  ).allowed;
  @override
  void initState() {
    super.initState();
    wasOperator = hasWork;
    if (wasOperator) index = 4;
    api.sessionChanges.addListener(changed);
  }

  void changed() {
    if (!mounted) return;
    setState(() {
      final work = hasWork;
      if (work && !wasOperator) index = 4;
      if (!work && index == 4) index = 3;
      wasOperator = work;
    });
  }

  @override
  void dispose() {
    api.sessionChanges.removeListener(changed);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final work = hasWork;
    final pages = <Widget>[
      const HomeScreen(),
      const MyBookingsScreen(),
      const BookingLookupScreen(embedded: true),
      const AccountScreen(),
      if (work) const OperatorPortalScreen(),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.directions_bus_filled, color: red),
            SizedBox(width: 8),
            Text('Rightway', style: TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: pages[index],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (v) => setState(() => index = v),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Trang chủ',
          ),
          const NavigationDestination(
            icon: Icon(Icons.confirmation_number_outlined),
            label: 'Vé của tôi',
          ),
          const NavigationDestination(
            icon: Icon(Icons.search),
            label: 'Tra cứu',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Tài khoản',
          ),
          if (work)
            const NavigationDestination(
              icon: Icon(Icons.work_outline),
              label: 'Làm việc',
            ),
        ],
      ),
    );
  }
}
