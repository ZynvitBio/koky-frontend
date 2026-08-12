import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FaqService } from '../services/faq/faq.service';

interface FaqItem {
  id: number;
  topic: string;
  information: string;
  active: boolean;
  isOpen?: boolean;
}

interface CategoryGroup {
  name: string;
  icon: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit {
  categories: CategoryGroup[] = [
    { name: 'Envíos y Compras', icon: 'icofont-delivery-time', items: [] },
    { name: 'Nutrición y Dieta', icon: 'icofont-heart-beat', items: [] },
    { name: 'Salud y Digestión', icon: 'icofont-medical-sign', items: [] },
    { name: 'Cocina y Conservación', icon: 'icofont-restaurant', items: [] },
    { name: 'Preguntas Generales', icon: 'icofont-question-circle', items: [] }
  ];

  activeCategoryIndex = 0;
  loading = true;

  constructor(private faqService: FaqService) {}

  ngOnInit(): void {
    this.faqService.getFaqs().subscribe({
      next: (faqs) => {
        const activeFaqs = faqs.filter(f => f.active);
        this.groupFaqs(activeFaqs);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching faqs', err);
        this.loading = false;
      }
    });
  }

  selectCategory(index: number): void {
    this.activeCategoryIndex = index;
  }

  toggleAccordion(item: FaqItem): void {
    // Cerramos los demás acordeones del grupo activo si queremos acordeón único
    this.categories[this.activeCategoryIndex].items.forEach(i => {
      if (i !== item) i.isOpen = false;
    });
    item.isOpen = !item.isOpen;
  }

  private groupFaqs(faqs: FaqItem[]): void {
    faqs.forEach(faq => {
      const topicLower = faq.topic.toLowerCase();
      
      if (
        topicLower.includes('envío') || 
        topicLower.includes('domicilio') || 
        topicLower.includes('comprar') || 
        topicLower.includes('dónde') || 
        topicLower.includes('donde') ||
        topicLower.includes('pago') ||
        topicLower.includes('colombia') ||
        topicLower.includes('bogotá')
      ) {
        this.categories[0].items.push(faq);
      } else if (
        topicLower.includes('pollo') || 
        topicLower.includes('proteína') || 
        topicLower.includes('proteina') || 
        topicLower.includes('peso') || 
        topicLower.includes('engorda') || 
        topicLower.includes('dieta') || 
        topicLower.includes('semana') || 
        topicLower.includes('veces')
      ) {
        this.categories[1].items.push(faq);
      } else if (
        topicLower.includes('sano') || 
        topicLower.includes('riñón') || 
        topicLower.includes('riñon') || 
        topicLower.includes('creatinina') || 
        topicLower.includes('barriga') || 
        topicLower.includes('efecto') || 
        topicLower.includes('alergia') || 
        topicLower.includes('soya') || 
        topicLower.includes('soja')
      ) {
        this.categories[2].items.push(faq);
      } else if (
        topicLower.includes('comer') || 
        topicLower.includes('sabor') || 
        topicLower.includes('conservar') || 
        topicLower.includes('dura') || 
        topicLower.includes('receta') || 
        topicLower.includes('cocinar')
      ) {
        this.categories[3].items.push(faq);
      } else {
        this.categories[4].items.push(faq);
      }
    });

    // Filtramos las categorías vacías para que no se muestren pestañas en blanco
    this.categories = this.categories.filter(c => c.items.length > 0);
    if (this.categories.length > 0) {
      this.activeCategoryIndex = 0;
    }
  }
}
