import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CoffeeMiniApp extends StatefulWidget {
  const CoffeeMiniApp({super.key});

  @override
  State<CoffeeMiniApp> createState() => _CoffeeMiniAppState();
}

class _CoffeeMiniAppState extends State<CoffeeMiniApp> {
  int _step = 0; // 0 = Menu, 1 = Ordering, 2 = Ordered
  String? _selectedCoffee;
  String? _orderToken;

  void _bookOrder(String coffee) {
    setState(() {
      _selectedCoffee = coffee;
      _step = 1;
    });

    // Simulate backend call
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _orderToken = "TKN-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}";
          _step = 2;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      height: 350,
      decoration: BoxDecoration(
        color: const Color(0xFFFAF9F6), // Warm white
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 5)),
        ],
        border: Border.all(color: const Color(0xFF6F4E37), width: 2), // Coffee brown
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF6F4E37),
              borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Center(
              child: Text(
                'Spatial Cafe',
                style: GoogleFonts.lora(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_step == 0) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Select your brew:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          _MenuButton(label: 'Espresso', price: '\$3.00', onTap: () => _bookOrder('Espresso')),
          const SizedBox(height: 8),
          _MenuButton(label: 'Latte', price: '\$4.50', onTap: () => _bookOrder('Latte')),
          const SizedBox(height: 8),
          _MenuButton(label: 'Cold Brew', price: '\$4.00', onTap: () => _bookOrder('Cold Brew')),
        ],
      );
    } else if (_step == 1) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: Color(0xFF6F4E37)),
          const SizedBox(height: 16),
          Text('Brewing your $_selectedCoffee...', textAlign: TextAlign.center),
        ],
      );
    } else {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 48),
          const SizedBox(height: 12),
          Text('Order Confirmed!', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          Text('Your $_selectedCoffee is ready.'),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.grey[200],
            child: Text(
              _orderToken ?? '',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, letterSpacing: 2),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => setState(() { _step = 0; }),
            child: const Text('Order Another'),
          )
        ],
      );
    }
  }
}

class _MenuButton extends StatelessWidget {
  final String label;
  final String price;
  final VoidCallback onTap;

  const _MenuButton({required this.label, required this.price, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        side: const BorderSide(color: Color(0xFFE0E0E0)),
        elevation: 0,
      ),
      onPressed: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(price, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
