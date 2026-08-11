import { LayoutMapScreen } from '@/components/layout-map-screen';

export default function AdminMapScreen() {
  return (
    <LayoutMapScreen
      tone="admin"
      title="Floor map"
      subtitle="Aisle / shelf layout — bins turn green when confirmed"
    />
  );
}
