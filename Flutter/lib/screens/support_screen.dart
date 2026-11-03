import 'package:flutter/material.dart';

import '../../services/support_service.dart';
import '../../widgets/app_widgets.dart';
import '../../widgets/remote.dart';
import 'operator/operator_widgets.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key, this.staff = false});
  final bool staff;
  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  int revision = 0;
  Future<void> create() async {
    await open(context, _NewConversation());
    if (mounted) setState(() => revision++);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.staff ? 'Trả lời khách hàng' : 'Hỗ trợ khách hàng'),
      actions: [
        IconButton(
          tooltip: 'Tải lại',
          onPressed: () => setState(() => revision++),
          icon: const Icon(Icons.refresh),
        ),
      ],
    ),
    body: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (!widget.staff) ...[
          FilledButton.icon(
            onPressed: () => open(context, const AiSupportScreen()),
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Trợ lý Rightway'),
          ),
          OutlinedButton.icon(
            onPressed: create,
            icon: const Icon(Icons.add_comment_outlined),
            label: const Text('Liên hệ nhân viên nhà xe'),
          ),
        ],
        heading('Hội thoại hỗ trợ'),
        Remote(
          key: ValueKey(revision),
          load: () => support.conversations(widget.staff),
          builder: (data) => Column(
            children: [
              if ((data as List).isEmpty)
                panel(const Text('Chưa có hội thoại.')),
              ...data.map<Widget>(
                (c) => panel(
                  ListTile(
                    title: Text(
                      '${c['company']?['name'] ?? c['customer']?['fullName'] ?? 'Hội thoại'}',
                    ),
                    subtitle: Text(
                      '${c['status'] == 'open' ? 'Đang mở' : 'Đã đóng'} • ${(c['messages'] as List?)?.firstOrNull?['content'] ?? ''}',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      await open(
                        context,
                        ConversationScreen(
                          id: '${c['id']}',
                          staff: widget.staff,
                        ),
                      );
                      if (mounted) setState(() => revision++);
                    },
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

class _NewConversation extends StatefulWidget {
  @override
  State<_NewConversation> createState() => _NewConversationState();
}

class _NewConversationState extends State<_NewConversation> {
  final text = TextEditingController();
  String? company;
  bool busy = false;
  String? error;
  @override
  void dispose() {
    text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Yêu cầu hỗ trợ mới')),
    body: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Remote(
          load: support.companies,
          builder: (d) => DropdownButtonFormField<String>(
            isExpanded: true,
            decoration: const InputDecoration(
              labelText: 'Nhà xe có nhân viên hỗ trợ',
            ),
            items: (d as List)
                .map<DropdownMenuItem<String>>(
                  (c) => DropdownMenuItem(
                    value: '${c['id']}',
                    child: Text('${c['name']}'),
                  ),
                )
                .toList(),
            onChanged: busy ? null : (v) => setState(() => company = v),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: text,
          maxLines: 5,
          maxLength: 2000,
          decoration: const InputDecoration(labelText: 'Nội dung cần hỗ trợ'),
        ),
        if (error != null) Text(error!),
        FilledButton(
          onPressed: busy
              ? null
              : () async {
                  if (company == null || text.text.trim().isEmpty) {
                    setState(() => error = 'Chọn nhà xe và nhập nội dung.');
                    return;
                  }
                  setState(() => busy = true);
                  try {
                    final c = await support.create(company!, text.text.trim());
                    if (!context.mounted) return;
                    await Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ConversationScreen(id: '${c['id']}'),
                      ),
                    );
                  } catch (e) {
                    if (mounted) setState(() => error = '$e');
                  } finally {
                    if (mounted) setState(() => busy = false);
                  }
                },
          child: Text(busy ? 'Đang gửi…' : 'Gửi yêu cầu'),
        ),
      ],
    ),
  );
}

class ConversationScreen extends StatefulWidget {
  const ConversationScreen({super.key, required this.id, this.staff = false});
  final String id;
  final bool staff;
  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  final text = TextEditingController();
  Map<String, dynamic>? data;
  bool busy = false;
  String? error;
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void dispose() {
    text.dispose();
    super.dispose();
  }

  Future<void> load() async {
    try {
      final d = await support.detail(widget.id, widget.staff);
      if (mounted) {
        setState(() {
          data = d;
          error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => error = '$e');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Hội thoại hỗ trợ'),
      actions: [
        IconButton(
          onPressed: busy ? null : load,
          icon: const Icon(Icons.refresh),
        ),
        if (data?['status'] == 'open')
          IconButton(
            tooltip: 'Kết thúc hội thoại',
            icon: const Icon(Icons.task_alt),
            onPressed: busy
                ? null
                : () async {
                    if (await opConfirm(
                          context,
                          'Kết thúc hội thoại?',
                          'Sau khi đóng sẽ không gửi thêm tin nhắn vào hội thoại này.',
                        ) !=
                        true) {
                      return;
                    }
                    setState(() => busy = true);
                    try {
                      await support.close(widget.id, widget.staff);
                      await load();
                    } catch (e) {
                      if (mounted) setState(() => error = '$e');
                    } finally {
                      if (mounted) setState(() => busy = false);
                    }
                  },
          ),
      ],
    ),
    body: Column(
      children: [
        if (error != null)
          Padding(padding: const EdgeInsets.all(12), child: Text(error!)),
        Expanded(
          child: data == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    for (final m in data!['messages'] as List)
                      Align(
                        alignment:
                            m['senderRole'] ==
                                (widget.staff ? 'staff' : 'customer')
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Card(
                          color: m['senderRole'] == 'staff'
                              ? const Color(0xFFEFF6FF)
                              : Colors.white,
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  m['senderRole'] == 'staff'
                                      ? 'Nhân viên'
                                      : 'Khách hàng',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SelectableText('${m['content']}'),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
        ),
        if (data?['status'] == 'open')
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: text,
                      maxLength: 2000,
                      maxLines: 3,
                      minLines: 1,
                      decoration: const InputDecoration(labelText: 'Tin nhắn'),
                    ),
                  ),
                  IconButton(
                    onPressed: busy
                        ? null
                        : () async {
                            if (text.text.trim().isEmpty) return;
                            setState(() => busy = true);
                            try {
                              await support.reply(
                                widget.id,
                                widget.staff,
                                text.text.trim(),
                              );
                              text.clear();
                              await load();
                            } catch (e) {
                              if (mounted) setState(() => error = '$e');
                            } finally {
                              if (mounted) setState(() => busy = false);
                            }
                          },
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        if (data?['status'] == 'closed')
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Hội thoại đã kết thúc.'),
          ),
      ],
    ),
  );
}

class AiSupportScreen extends StatefulWidget {
  const AiSupportScreen({super.key});
  @override
  State<AiSupportScreen> createState() => _AiSupportScreenState();
}

class _AiSupportScreenState extends State<AiSupportScreen> {
  final text = TextEditingController();
  final messages = <Map<String, dynamic>>[];
  bool busy = false;
  String? error;
  @override
  void dispose() {
    text.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Trợ lý Rightway')),
    body: ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Trợ lý trả lời theo tài liệu, mỗi câu hỏi độc lập. Không gửi mật khẩu hoặc OTP. Nội dung được chuyển đến nhà cung cấp AI do hệ thống cấu hình.',
        ),
        Remote(
          load: support.guides,
          builder: (d) => ExpansionTile(
            title: const Text('Hướng dẫn sử dụng'),
            children: [
              for (final g in d['guides'] as List)
                ListTile(
                  title: Text('${g['title']}'),
                  subtitle: Text('${g['content']}'),
                ),
            ],
          ),
        ),
        for (final m in messages)
          panel(
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${m['question']}',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                SelectableText('${m['answer']}'),
                for (final s in m['sources'] as List? ?? [])
                  Text('Nguồn: ${s['title']}'),
                if (m['needsStaff'] == true)
                  TextButton(
                    onPressed: () => open(context, const SupportScreen()),
                    child: const Text('Chuyển sang hỗ trợ nhà xe'),
                  ),
              ],
            ),
          ),
        if (error != null) Text(error!),
        TextField(
          controller: text,
          maxLength: 1200,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Câu hỏi'),
        ),
        FilledButton(
          onPressed: busy
              ? null
              : () async {
                  final question = text.text.trim();
                  if (question.isEmpty) return;
                  setState(() => busy = true);
                  try {
                    final r = await support.ask(question);
                    if (mounted) {
                      setState(() {
                        messages.add({...r, 'question': question});
                        text.clear();
                        error = null;
                      });
                    }
                  } catch (e) {
                    if (mounted) setState(() => error = '$e');
                  } finally {
                    if (mounted) setState(() => busy = false);
                  }
                },
          child: Text(busy ? 'Đang trả lời…' : 'Gửi câu hỏi'),
        ),
      ],
    ),
  );
}
