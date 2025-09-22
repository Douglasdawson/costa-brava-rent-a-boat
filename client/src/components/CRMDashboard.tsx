import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Users, 
  Euro, 
  TrendingUp, 
  Clock, 
  Anchor,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function CRMDashboard() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [selectedTimeRange, setSelectedTimeRange] = useState("today");

  // todo: remove mock functionality - replace with real API data
  const stats = {
    todayBookings: 8,
    todayRevenue: 1240,
    weekBookings: 45,
    weekRevenue: 7850,
    availableBoats: 5,
    totalBoats: 6
  };

  const recentBookings = [
    {
      id: "BK001",
      customerName: "Ana García",
      boatName: "ASTEC 450",
      date: "2024-09-22",
      time: "09:00",
      duration: "2h",
      status: "PAID",
      total: 115,
      phone: "+34 600 000 000"
    },
    {
      id: "BK002", 
      customerName: "Carlos López",
      boatName: "Trimarchi 57S",
      date: "2024-09-22",
      time: "11:00",
      duration: "4h",
      status: "PENDING",
      total: 240,
      phone: "+34 600 111 111"
    },
    {
      id: "BK003",
      customerName: "Maria Santos",
      boatName: "ASTEC 480",
      date: "2024-09-22",
      time: "15:00",
      duration: "8h",
      status: "HOLD",
      total: 270,
      phone: "+34 600 222 222"
    }
  ];

  const upcomingBookings = [
    {
      id: "BK004",
      customerName: "Juan Martínez",
      boatName: "Solar 450",
      date: "2024-09-23",
      time: "10:00",
      duration: "4h",
      status: "PAID",
      total: 150
    },
    {
      id: "BK005",
      customerName: "Laura Fernández", 
      boatName: "ASTEC 450",
      date: "2024-09-23",
      time: "14:00",
      duration: "2h",
      status: "PAID",
      total: 115
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PAID": return "default";
      case "PENDING": return "secondary";
      case "HOLD": return "outline";
      case "CANCELLED": return "destructive";
      default: return "secondary";
    }
  };

  const handleBookingAction = (action: string, bookingId: string) => {
    console.log(`${action} action for booking:`, bookingId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Anchor className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM Costa Brava</h1>
              <p className="text-sm text-gray-600">Sistema de gestión de reservas</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" data-testid="button-export-data">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button data-testid="button-new-booking">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 mt-6">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "bookings", label: "Reservas", icon: Calendar },
            { id: "customers", label: "Clientes", icon: Users },
            { id: "fleet", label: "Flota", icon: Anchor },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 font-medium rounded-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Dashboard Tab */}
        {selectedTab === "dashboard" && (
          <div className="space-y-6">
            {/* Time range selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Periodo:</span>
              {["today", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === range
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                  data-testid={`filter-${range}`}
                >
                  {range === "today" ? "Hoy" : range === "week" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reservas Hoy</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.todayBookings}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                      <p className="text-3xl font-bold text-gray-900 flex items-center">
                        <Euro className="w-6 h-6 mr-1" />
                        {stats.todayRevenue}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Semana</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {stats.weekBookings} reservas
                      </p>
                      <p className="text-sm text-gray-600">{stats.weekRevenue}€</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Flota</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.availableBoats}/{stats.totalBoats}
                      </p>
                      <p className="text-sm text-gray-600">Disponibles</p>
                    </div>
                    <Anchor className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Reservas de Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover-elevate"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">{booking.customerName}</p>
                          <p className="text-sm text-gray-600">
                            {booking.boatName} • {booking.time} • {booking.duration}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <span className="font-semibold text-gray-900">{booking.total}€</span>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleBookingAction("view", booking.id)}
                            data-testid={`button-view-${booking.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleBookingAction("edit", booking.id)}
                            data-testid={`button-edit-${booking.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {booking.boatName} • {booking.date} {booking.time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <span className="font-semibold text-gray-900">{booking.total}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs placeholder */}
        {selectedTab !== "dashboard" && (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedTab === "bookings" && "Gestión de Reservas"}
                {selectedTab === "customers" && "Gestión de Clientes"}  
                {selectedTab === "fleet" && "Gestión de Flota"}
              </h3>
              <p className="text-gray-600 mb-4">
                Esta sección estará disponible en la implementación completa.
              </p>
              <Button 
                onClick={() => setSelectedTab("dashboard")}
                data-testid="button-back-dashboard"
              >
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}