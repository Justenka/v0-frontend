"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

type Valiuta = {
  id_valiuta: number;
  name: string;
};

type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  friendRequests: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Pranešimai
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);

  // UI „tipai“ (kol kas tik front-end dekoracija, jei nori – vėliau irgi išsaugosim)
  const [groupInvites, setGroupInvites] = useState(true);
  const [newExpenses, setNewExpenses] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [messages, setMessages] = useState(true);

  // Valiutų būsena
  const [valiutos, setValiutos] = useState<Valiuta[]>([]);
  const [selectedValiuta, setSelectedValiuta] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  // Užkrauname valiutas + pranešimų nustatymus
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Valiutos
        const valResp = await fetch(`${API_BASE}/api/valiutos`);
        const valData = await valResp.json();
        setValiutos(valData);

        const userResp = await fetch(`${API_BASE}/api/vartotojai/${user.id}`);
        const userData = await userResp.json();
        setSelectedValiuta(String(userData.valiutos_kodas));

        // 2. Pranešimų nustatymai
      const notifResp = await fetch(
        `${API_BASE}/api/pranesimu-nustatymai/${user.id}`
      )
      if (notifResp.ok) {
        const notifData = await notifResp.json()
        setEmailNotifications(!!notifData.el_pastas_aktyvus)
        setPushNotifications(!!notifData.push_pranesimai)
        setFriendRequests(!!notifData.draugu_kvietimai)
        setGroupInvites(!!notifData.grupes_kvietimai)
        setNewExpenses(!!notifData.naujos_islaidos)
        setPaymentReminders(!!notifData.mokejimo_priminimai)
        setMessages(!!notifData.zinutes)
      } else {
        console.warn("Nepavyko gauti pranešimų nustatymų")
      }
      } catch (err) {
        console.error(err);
        toast.error("Nepavyko užkrauti nustatymų");
      }
    };

    if (!isLoading && user) {
      void fetchData();
    }
  }, [isLoading, user]);

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)

    try {
      // 1) valiuta
      const currencyRes = await fetch(`${API_BASE}/api/vartotojai/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valiutos_kodas: Number(selectedValiuta) }),
      })
      if (!currencyRes.ok) throw new Error("Nepavyko išsaugoti valiutos")

      // 2) pranešimų nustatymai
      const notifRes = await fetch(
        `${API_BASE}/api/pranesimu-nustatymai/${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            el_pastas_aktyvus: emailNotifications,
            push_pranesimai: pushNotifications,
            draugu_kvietimai: friendRequests,
            grupes_kvietimai: groupInvites,
            naujos_islaidos: newExpenses,
            mokejimo_priminimai: paymentReminders,
            zinutes: messages,
          }),
        },
      )

      if (!notifRes.ok) {
        const body = await notifRes.json().catch(() => ({}))
        throw new Error(body.message || "Nepavyko išsaugoti pranešimų nustatymų")
      }

      toast.success("Nustatymai išsaugoti")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Klaida saugant nustatymus")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Nustatymai</h1>

      <div className="space-y-6">
        {/* Valiuta */}
        <Card>
          <CardHeader>
            <CardTitle>Pagrindinė valiuta</CardTitle>
            <CardDescription>
              Pasirinkite, kokia valiuta bus naudojama visoje programoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-32">Valiuta</Label>
                <Select
                  value={selectedValiuta}
                  onValueChange={setSelectedValiuta}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Pasirinkite valiutą" />
                  </SelectTrigger>
                  <SelectContent>
                    {valiutos.map((v) => (
                      <SelectItem
                        key={v.id_valiuta}
                        value={String(v.id_valiuta)}
                      >
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pranešimai */}
        <Card>
          <CardHeader>
            <CardTitle>Pranešimų nustatymai</CardTitle>
            <CardDescription>
              Valdykite, kaip norite gauti pranešimus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bendrai */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>El. pašto pranešimai</Label>
                  <p className="text-sm text-gray-600">
                    Gauti pranešimus el. paštu
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push pranešimai</Label>
                  <p className="text-sm text-gray-600">
                    Gauti pranešimus naršyklėje
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator />

              {/* Tipai */}
              <div className="space-y-4">
                <Label className="text-base">Pranešimų tipai</Label>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Draugų kvietimai</Label>
                    <p className="text-sm text-gray-600">
                      Kai gaunate kvietimą draugauti
                    </p>
                  </div>
                  <Switch
                    checked={friendRequests}
                    onCheckedChange={setFriendRequests}
                  />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Grupės kvietimai</Label>
                    <p className="text-sm text-gray-600">
                      Kai esate pakviesti į grupę
                    </p>
                  </div>
                  <Switch
                    checked={groupInvites}
                    onCheckedChange={setGroupInvites}
                  />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Naujos išlaidos</Label>
                    <p className="text-sm text-gray-600">
                      Kai pridedama nauja išlaida
                    </p>
                  </div>
                  <Switch
                    checked={newExpenses}
                    onCheckedChange={setNewExpenses}
                  />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Mokėjimo priminimai</Label>
                    <p className="text-sm text-gray-600">
                      Priminimai apie nesumokėtas skolas
                    </p>
                  </div>
                  <Switch
                    checked={paymentReminders}
                    onCheckedChange={setPaymentReminders}
                  />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Žinutės</Label>
                    <p className="text-sm text-gray-600">
                      Naujos žinutės ir pokalbiai
                    </p>
                  </div>
                  <Switch
                    checked={messages}
                    onCheckedChange={setMessages}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saugoma..." : "Išsaugoti nustatymus"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
