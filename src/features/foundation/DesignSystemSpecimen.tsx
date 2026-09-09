"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/Menu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StyledTabList, TabContent, TabTrigger, Tabs } from "@/components/ui/Tabs";
import { MotionReveal } from "@/features/foundation/MotionReveal";

export function DesignSystemSpecimen() {
  return (
    <MotionReveal>
      <section className="design-system-specimen" aria-labelledby="specimen-title">
        <div>
          <p className="eyebrow">Foundation specimen</p>
          <h2 id="specimen-title">Estados y controles para construir sin improvisar.</h2>
        </div>
        <div className="specimen-controls">
          <Button>Continuar</Button>
          <Button variant="secondary">Revisar después</Button>
          <StatusBadge tone="ready">Disponible</StatusBadge>
          <StatusBadge tone="warning">Revisar</StatusBadge>
          <StatusBadge tone="missing">Falta</StatusBadge>
        </div>
        <div className="specimen-grid">
          <Field id="foundation-name" label="Nombre del hogar" placeholder="Nuestro hogar" hint="Visible para miembros invitados." />
          <Tabs defaultValue="real">
            <StyledTabList aria-label="Tipo de estado">
              <TabTrigger value="real">Real</TabTrigger>
              <TabTrigger value="projected">Previsto</TabTrigger>
            </StyledTabList>
            <TabContent value="real">Lo que existe físicamente ahora.</TabContent>
            <TabContent value="projected">Lo que el plan espera consumir.</TabContent>
          </Tabs>
          <Menu>
            <MenuTrigger asChild><Button variant="ghost">Más acciones</Button></MenuTrigger>
            <MenuContent align="start">
              <MenuItem>Duplicar</MenuItem>
              <MenuItem>Archivar</MenuItem>
            </MenuContent>
          </Menu>
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Abrir detalle</Button></DialogTrigger>
            <DialogContent>
              <DialogTitle>Detalle de foundation</DialogTitle>
              <DialogDescription>Los diálogos devolverán el foco al control que los abrió.</DialogDescription>
              <DialogClose asChild><Button variant="primary">Cerrar</Button></DialogClose>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </MotionReveal>
  );
}
