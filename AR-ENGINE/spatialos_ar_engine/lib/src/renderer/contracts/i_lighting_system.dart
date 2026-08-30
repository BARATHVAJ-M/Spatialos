/// Simulates global and local lighting for AR blending.
abstract class ILightingSystem {
  void setAmbientLight(double intensity, int hexColor);
  void addPointLight(String id, double x, double y, double z);
}
