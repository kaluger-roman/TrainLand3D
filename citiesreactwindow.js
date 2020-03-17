"use strict"
class CitiesWindow extends React.Component {
    constructor(props) {
        super(props);
        let iconleftpanel=document.querySelector('[data-allcities]');
        iconleftpanel.onclick=()=>{
            let citieswindow=document.getElementById('citieswindow');
            if(citieswindow.style.visibility==='hidden')
                citieswindow.style.visibility='visible';
            else
                citieswindow.style.visibility='hidden';
        };
    }
    render(){
        return(
            <div></div>
        );
    }
}
ReactDOM.render(<CitiesWindow />, document.getElementById("citieswindow"));
