import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Image as ImageIcon, FileText, UserCog } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    customers: 0,
    images: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [users, customers, images, pages] = await Promise.all([
          api.users.list(),
          api.customers.list({ limit: 1 }),
          api.images.list({ limit: 1 }),
          api.pages.list({ limit: 1 }),
        ]);
        setStats({
          users: users.length,
          customers: customers.pagination.total,
          images: images.pagination.total,
          pages: pages.pagination.total,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { title: '用户', value: stats.users, icon: UserCog, color: 'text-blue-600' },
    { title: '客户', value: stats.customers, icon: Users, color: 'text-green-600' },
    { title: '图片', value: stats.images, icon: ImageIcon, color: 'text-purple-600' },
    { title: '页面', value: stats.pages, icon: FileText, color: 'text-orange-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">仪表盘</h1>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
