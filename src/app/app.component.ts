import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'circle-carousel';

  slides = [
    { id: 1, subtitle: 'Real3D', image: 'assets/img/bg_3.jpg', text: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem iure eaque eum, error doloremque, quis obcaecati amet alias esse exercitationem nobis aperiam eligendi reiciendis velit reprehenderit! Dolorum consequuntur cupiditate quas!' },
    { id: 2, subtitle: 'IMAX', image: 'assets/img/bg_2.png', text: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem iure eaque eum, error doloremque, quis obcaecati amet alias esse exercitationem nobis aperiam eligendi reiciendis velit reprehenderit! Dolorum consequuntur cupiditate quas!' },
    { id: 3, subtitle: '2D', image: 'assets/img/bg_1.jpg', text: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem iure eaque eum, error doloremque, quis obcaecati amet alias esse exercitationem nobis aperiam eligendi reiciendis velit reprehenderit! Dolorum consequuntur cupiditate quas!' },
    { id: 4, subtitle: '4DX', image: '', text: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem iure eaque eum, error doloremque, quis obcaecati amet alias esse exercitationem nobis aperiam eligendi reiciendis velit reprehenderit! Dolorum consequuntur cupiditate quas!' },
    { id: 5, subtitle: 'Dolby', image: 'assets/img/bg_3.jpg', text: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Rem iure eaque eum, error doloremque, quis obcaecati amet alias esse exercitationem nobis aperiam eligendi reiciendis velit reprehenderit! Dolorum consequuntur cupiditate quas!' }
  ];
}
