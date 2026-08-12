import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; //   Asegúrate de que la ruta a tu componente Home sea correcta
import { BlogComponent } from './blog/blog.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { CartoverviewComponent } from './cartoverview/cartoverview.component';
import { BlogdetailsComponent } from './blogdetails/blogdetails.component';
import { ProductdetailsComponent } from './productdetails/productdetails.component';
import { OrderconfirmationComponent} from './orderconfirmation/orderconfirmation.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { RefundPolicyComponent } from './refund-policy/refund-policy.component';
import { WholesalePolicyComponent } from './wholesale-policy/wholesale-policy.component';
import { ShippingPolicyComponent } from './shipping-policy/shipping-policy.component';
import { TermsConditionsComponent } from './terms-conditions/terms-conditions.component';
import { FaqComponent } from './faq/faq.component';

export const routes: Routes = [
  { path: 'preguntas-frecuentes', component: FaqComponent },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'blog', 
    component: BlogComponent,
  },
  {
    path: 'checkout', 
    component: CheckoutComponent,
  },
   {
    path: 'cartoverview', 
    component: CartoverviewComponent,
  },
   {
    path: 'blog/:slug', 
    component: BlogdetailsComponent,
  },
   { path: 'productdetails/:slug', 
    component: ProductdetailsComponent },
  {
    path: 'orderconfirmation', 
    component: OrderconfirmationComponent,
  },
  { path: 'politica-privacidad', 
    component: PrivacyPolicyComponent },

  { path: 'devoluciones', 
    component: RefundPolicyComponent },
    
  { path: 'ventas-al-mayor', 
    component: WholesalePolicyComponent },

  { path: 'politica-envio', 
    component: ShippingPolicyComponent },

  { path: 'terminos-y-condiciones', 
    component: TermsConditionsComponent },
  { path: 'product/:slug', redirectTo: 'productdetails/:slug', pathMatch: 'full' },
  {
    path: '',
    component: HomeComponent,
  },
  
  
];