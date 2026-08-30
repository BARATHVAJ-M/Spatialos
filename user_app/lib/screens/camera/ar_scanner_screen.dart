import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:go_router/go_router.dart';
import 'ar_render_layer.dart';

class ArScannerScreen extends StatefulWidget {
  const ArScannerScreen({super.key});

  @override
  State<ArScannerScreen> createState() => _ArScannerScreenState();
}

class _ArScannerScreenState extends State<ArScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController();
  bool _qrFound = false;
  String? _locationId;

  void _onDetect(BarcodeCapture capture) {
    if (_qrFound) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        final code = barcode.rawValue!;
        // Assuming the QR code contains the Location ID
        if (code.isNotEmpty) {
          setState(() {
            _qrFound = true;
            _locationId = code;
          });
          _scannerController.stop();
          break;
        }
      }
    }
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_qrFound && _locationId != null) {
      // Switch entirely to ARCore native physical tracking
      return ArRenderLayer(locationId: _locationId!);
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _onDetect,
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.pop(),
              ),
            ),
          ),
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.amber, width: 4),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.qr_code_scanner, color: Colors.amber, size: 64),
                  SizedBox(height: 16),
                  Text(
                    'Scan SpatialOS Location QR',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
