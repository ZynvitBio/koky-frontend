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
export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
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
  {
    path: '',
    redirectTo: 'home', 
    pathMatch: 'full' 
  },
  
  
];