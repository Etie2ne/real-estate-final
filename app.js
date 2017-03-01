//importing modules
var express = require( 'express' );
var request = require( 'request' );
var cheerio = require( 'cheerio' );

//creating a new express server
var app = express();

//setting EJS as the templating engine
app.set( 'view engine', 'ejs' );

//setting the 'assets' directory as our static assets dir (css, js, img, etc...)
app.use( '/assets', express.static( 'assets' ) );


//makes the server respond to the '/' route and serving the 'home.ejs' template in the 'views' directory
app.get( '/', function ( req, res ) {
    var URL = req.query.urlLBC

    if ( URL ) {
        callLBC( URL, res )
    }
    else {

        res.render( 'home', {
            message: 'Comparateur de prix pour Appartement'
        });
    }
});


//launch the server on the 3000 port
app.listen( 3000, function () {
    console.log( 'App listening on port 3000!' );
});

function callLBC( _url, res ) {
    request( _url, function ( error, response, body ) {
        if ( !error && response.statusCode == 200 ) {
            var lbc_body = cheerio.load( body )          //cheerio : charger le body d'un script
            var Price = lbc_body( 'span.value' ).eq( 0 ).text()

            var price = lbc_body( 'span.value' ).eq( 0 ).text().replace( '€', '' )   //récupérer les infos de la ligne 0 des infos sur lbc (prix)
            price = price.replace( / /g, "" )    //supression de € de la valeur




            console.log( price )
            var Ville = lbc_body( 'span.value' ).eq( 1 ).text().split( ' ' )[0]       //séparer le nom de la vile du code postal
            var codePostal = lbc_body( 'span.value' ).eq( 1 ).text().split( ' ' )[1]        //attribuer case0 au nom de la ville et case1 au code postal
            var typeDeBien = lbc_body( 'span.value' ).eq( 2 ).text()
            var taille = lbc_body( 'span.value' ).eq( 4 ).text().split( ' ' )[0]    //séparer la surface de m²
            console.log( taille )
            var prixAuMetreCarre = price / taille
            console.log( prixAuMetreCarre )


            request( 'http://www.meilleursagents.com/prix-immobilier/' + Ville.toLowerCase() + '-' + codePostal, function ( error, response, body ) {
                if ( !error && response.statusCode == 200 ) {
                    var ma_body = cheerio.load( body )
                    var prixMoyenAppartement = ma_body( 'div.small-4.medium-2.columns.prices-summary__cell--median' ).eq( 0 ).text().replace( '€', '' ).replace( /\s/g, '' )
                    prixMoyenAppartement = parseFloat( prixMoyenAppartement )
                    var prixMoyenMaison = ma_body( 'div.small-4.medium-2.columns.prices-summary__cell--median' ).eq( 1 ).text().replace( '€', '' ).replace( /\s/g, '' )
                    var message = ' '
                    if ( typeDeBien == 'Appartement' ) {
                        if ( prixMoyenAppartement > prixAuMetreCarre ) {
                            message = 'Le prix de cet appartement est inférieur à la moyenne de la région'
                        }
                        else {
                            message = 'Le prix de cet appartement est supérieur à la moyenne de la région'
                        }
                    }
                    else {
                        if ( prixMoyenMaison > prixAuMetreCarre ) {
                            message = 'Le prix de cette maison est inférieur à la moyenne de la région'
                        }
                        else {
                            message = 'Le prix de cette maison est supérieur à la moyenne de la région'
                        }

                    }

                    res.render( 'home', {
                        message: message
                    });
                }
            })
        }
    })
}