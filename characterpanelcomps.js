"use strict"
let charcters=new Map();
charcters.set('Arkasha',{path:'./images/persons/arkasha.jpg'}).set('Chug',{path:'./images/persons/chug.jpg'});
let selectedcharacter='Arkasha';
let avatar=document.getElementById('avatar');
avatar.onclick=()=>
{
    let CharacterWindow=document.getElementById('CharacterWindow');
    if(CharacterWindow.style.visibility==='hidden')
        CharacterWindow.style.visibility='visible';
    else
        CharacterWindow.style.visibility='hidden';
};

class CharacterPanel extends React.Component{
    constructor(props){
        super(props);

        this.state=({
            selectedcharacter:selectedcharacter,
        });

    }
    CharacterWindow=document.getElementById('CharacterWindow');
    render() {

    return(
        <img id='charactericon'
             src={charcters.get(selectedcharacter).path}/>
    );
    }
}
function BlockInGallery(props) {
    return(
        <div className='outsideblockgal' id={props.id} onMouseEnter={props.entermouseblock} onMouseLeave={props.leavemouseblock} onClick={props.selectcharacter}>
            <div className='innerblockgal'>
                <div className='headerpartgal'>
                    <span className='headergal'>{props.headtext}</span>
                </div>
                <div className='picturepartgal'>
                    <img className='pictofcharactergal' src={props.imgsrc}/>
                </div>
                <div className='descriptpartgal'>
                    <p className='descriptpartin'>{props.descript}</p>
                </div>
            </div>
        </div>
    );
}
class ChooseCharacterWindow extends React.Component{
    constructor(props) {
        super(props);
        this.selectcharacter=this.selectcharacter.bind(this);
        this.entermouseblock=this.entermouseblock.bind(this);
        this.leavemouseblock=this.leavemouseblock.bind(this);

    }
    componentDidMount(){
        let outsideblockgal=document.querySelector(`[id=${selectedcharacter}]`);
        let style=outsideblockgal.style;
        style.borderColor='red';
        style.borderWidth='6px';
    }
    selectcharacter(e){
        let prevblock=document.querySelector(`[id=${selectedcharacter}]`);
        let prevstyle=prevblock.style;
        prevstyle.borderColor='#0000cc';
        prevstyle.borderWidth='2px';
        let outsideblockgal=e.target.closest('.outsideblockgal');
        selectedcharacter=outsideblockgal.getAttribute('id');
        let style=outsideblockgal.style;
        style.borderColor='red';
        style.borderWidth='6px';
        ReactDOM.render(<CharacterPanel />, document.getElementById("avatar"));
    }
    entermouseblock(e){
        let selectblock=document.querySelector(`[id=${selectedcharacter}]`);
        let outsideblockgal=e.target.closest('.outsideblockgal');
        if (outsideblockgal!==selectblock){
            let style=outsideblockgal.style;
            style.borderColor='#00ff00';
            style.borderWidth='2px';
        }
    }
    leavemouseblock(e){
        let selectblock=document.querySelector(`[id=${selectedcharacter}]`);
        let outsideblockgal=e.target.closest('.outsideblockgal');
        if (outsideblockgal!==selectblock){
            let style=outsideblockgal.style;
            style.borderColor='#0000cc';
            style.borderWidth='2px';
        }
    }
        render(){
            return(
                <div id="maincontainercharacterwindow">
                    <div id='charactergallery'>
                        <BlockInGallery id='Arkasha' selectcharacter={this.selectcharacter} leavemouseblock={this.leavemouseblock}  entermouseblock={this.entermouseblock}
                                        descript='классный мужик' headtext='Аркаша' imgsrc={charcters.get('Arkasha').path}/>
                        <BlockInGallery id='Chug' selectcharacter={this.selectcharacter} leavemouseblock={this.leavemouseblock}  entermouseblock={this.entermouseblock}
                                        descript='чисто машина' headtext='Чагги' imgsrc={charcters.get('Chug').path}/>
                        <BlockInGallery/>
                        <BlockInGallery/>
                    </div>
                </div>
            );
        }
    }

ReactDOM.render(<CharacterPanel />, document.getElementById("avatar"));
ReactDOM.render(<ChooseCharacterWindow />, document.getElementById("CharacterWindow"));
