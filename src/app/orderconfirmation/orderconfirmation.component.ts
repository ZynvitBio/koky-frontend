import { Component, OnInit, PLATFORM_ID, Inject, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../services/order/order.service';

@Component({
  selector: 'app-orderconfirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orderconfirmation.component.html',
  styleUrl: './orderconfirmation.component.css'
})
export class OrderconfirmationComponent implements OnInit {
  // Variables para mostrar en el resumen de Koky
  purchasedItems: any[] = [];
  subtotal: number = 0;
  shippingCost: number = 0;
  discount: number = 0;
  totalPaid: number = 0;
  orderReference: string = '';
  invoicePdfUrl: string | null = null;
  generatingInvoice = false;

  private orderService = inject(OrderService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    // 🛡️ Blindaje: Solo ejecutamos lógica de almacenamiento si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      
      // 1. Recuperamos la orden guardada en el localStorage tras el éxito en Wompi
      const lastOrderData = localStorage.getItem('last_koky_order');
      
      if (lastOrderData) {
        try {
          const lastOrder = JSON.parse(lastOrderData);
          
          // 2. Mapeamos los datos a nuestras variables de la vista
          this.purchasedItems = lastOrder.productos || [];
          this.subtotal = lastOrder.pago?.subtotal || 0;
          this.shippingCost = lastOrder.pago?.envio || 0;
          this.discount = lastOrder.pago?.descuento || 0;
          this.totalPaid = lastOrder.pago?.total || 0;
          
          // 3. Usamos la referencia que generamos para Wompi
          this.orderReference = lastOrder.referencia || 'Pendiente';

          // 4. Cargar URL de la factura
          this.cargarFacturaUrl();
        } catch (error) {
          console.error("Error al procesar los datos de la orden:", error);
        }
      }
    }
  }

  cargarFacturaUrl(retryCount = 0): void {
    if (!this.orderReference || this.orderReference === 'Pendiente') return;

    this.generatingInvoice = true;
    this.orderService.getConfirmationDetails(this.orderReference).subscribe({
      next: (res) => {
        if (res.invoice_pdf_url) {
          this.invoicePdfUrl = res.invoice_pdf_url;
          this.generatingInvoice = false;
        } else if (retryCount < 6) {
          setTimeout(() => {
            this.cargarFacturaUrl(retryCount + 1);
          }, 3000);
        } else {
          this.generatingInvoice = false;
        }
      },
      error: (err) => {
        console.error("Error al obtener la factura:", err);
        if (retryCount < 6) {
          setTimeout(() => {
            this.cargarFacturaUrl(retryCount + 1);
          }, 3000);
        } else {
          this.generatingInvoice = false;
        }
      }
    });
  }

  downloadInvoice() {
    if (this.invoicePdfUrl && isPlatformBrowser(this.platformId)) {
      window.open(this.invoicePdfUrl, '_blank');
    }
  }

  // Función para que el cliente guarde su soporte de pago
  printOrder() {
    // 🛡️ Blindaje: window no existe en el servidor
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }
}